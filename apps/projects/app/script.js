import Aragon from '@aragon/api'
import { pluck } from 'rxjs/operators'

import { GraphQLClient } from 'graphql-request'
import { STATUS } from './utils/github'
import vaultAbi from '../../shared/json-abis/vault'
import tokenSymbolAbi from './abi/token-symbol.json'
import tokenDecimalsAbi from './abi/token-decimal.json'
import { ipfsGet } from './utils/ipfs-helpers'

const tokenAbi = [].concat(tokenDecimalsAbi, tokenSymbolAbi)

const status = [ 'funded', 'review-applicants', 'in-progress', 'review-work', 'fulfilled' ]
const assignmentRequestStatus = [ 'Unreviewed', 'Accepted', 'Rejected' ]

const SUBMISSION_STAGE = 2

const toAscii = hex => {
  // Find termination
  let str = ''
  let i = 0,
    l = hex.length
  if (hex.substring(0, 2) === '0x') {
    i = 2
  }
  for (; i < l; i += 2) {
    let code = parseInt(hex.substr(i, 2), 16)
    str += String.fromCharCode(code)
  }

  return str
}

const repoData = id => `{
    node(id: "${id}") {
      ... on Repository {
        name
        url
        description
        defaultBranchRef {
            target {
              ...on Commit {
                history {
                  totalCount
                }
              }
            }
          }
        collaborators {
          totalCount
        }
      }
    }
}`

const determineStateVars = (state) => {
  const repos = (!!state && state.repos) || []
  const tokens = (!!state && state.tokens) || []
  const issues = (!!state && state.issues) || []
  const bountySettings = (!!state && state.bountySettings) || {}

  return { repos, tokens, bountySettings, issues }
}

const app = new Aragon()
let appState = determineStateVars()
let vault, bounties, tokens

/**
 * Observe the github object.
 * @return {Observable} An observable of github object over time.
 */
const github = () => {
  return app.rpc
    .sendAndObserveResponses('cache', [ 'get', 'github' ])
    .pipe(pluck('result'))
}

let client
const getRepoData = repo => {
  try {
    let data = client.request(repoData(repo))
    return data
  } catch (err) {
    console.error('getRepoData failed: ', err)
  }
}

const initClient = authToken => {
  client = new GraphQLClient('https://api.github.com/graphql', {
    headers: {
      Authorization: 'Bearer ' + authToken,
    },
  })
}

const loadReposFromQueue = async () => {
  if (unloadedRepoQueue && unloadedRepoQueue.length > 0) {
    const loadedRepoQueue = await Promise.all(unloadedRepoQueue.map(
      async repoId => {
        const { repos } = await syncRepos(appState, { repoId })
        return repos[0]
      }
    ))

    const repos = (appState && appState.repos) || []
    const newState = { ...appState, repos: [ ...repos, ...loadedRepoQueue ] }
    unloadedRepoQueue = []
    app.cache('state', newState)
  }
  return
}

// TODO: Handle cases where checking validity of token fails (revoked, etc)

github().subscribe(async result => {
  console.log('github object received from cache:', result)
  if (result) {
    result.token && initClient(result.token)
    await loadReposFromQueue()
    return
  } else app.cache('github', { status: STATUS.INITIAL })
})

app.events().subscribe(handleEvents)

app.state().subscribe(state => {
  state && console.log('[Projects script] state subscription:\n', state)
  const { repos, bountySettings, tokens, issues } = determineStateVars(state)
  appState = cloneAppState({ repos, bountySettings, tokens, issues })
  if (!vault) {
    // this should be refactored to be a "setting"
    app.call('vault').subscribe(response => {
      vault = app.external(response, vaultAbi)
      vault.events().subscribe(handleEvents)
    })
  }
})

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function handleEvents(response) {
  let nextState, data, newData
  switch (response.event) {
  case 'RepoAdded':
    console.log('[Projects] event RepoAdded', cloneAppState(appState))
    nextState = await syncRepos(cloneAppState(appState), response.returnValues)
    appState = cloneAppState(nextState)
    break
  case 'RepoRemoved':
    console.log('[Projects] RepoRemoved', response.returnValues)
    const id = response.returnValues.repoId
    const repoIndex = cloneAppState(appState).repos.findIndex(repo => repo.id === id)
    if (repoIndex === -1) break
    appState.repos.splice(repoIndex,1)
    nextState = cloneAppState(appState)
    break
  case 'RepoUpdated':
    console.log('[Projects] RepoUpdated', response.returnValues)
    nextState = await syncRepos(cloneAppState(appState), response.returnValues)
    appState = cloneAppState(nextState)
  case 'BountyAdded':
    console.log('[Projects] BountyAdded', appState, response.returnValues)
    if(!response.returnValues) {
      break
    }
    data = await loadIssueData(response.returnValues)
    data.workStatus = status[0]
    nextState = syncIssues(cloneAppState(appState), response.returnValues, data, [])
    appState = cloneAppState(nextState)
    break
  case 'AssignmentRequested':
    console.log('[Projects] AssignmentRequested', appState, response.returnValues)
    if(!response.returnValues) {
      break
    }
    data = await loadIssueData(response.returnValues)
    data.workStatus = status[1]
    newData = await updateIssueDetail(data, response)
    nextState = syncIssues(cloneAppState(appState), response.returnValues, newData)
    appState = cloneAppState(nextState)
    break
  case 'AssignmentApproved':
    console.log('[Projects] AssignmentApproved', appState, response.returnValues)
    if(!response.returnValues) {
      break
    }
    data = await loadIssueData(response.returnValues)
    data.workStatus = status[2]
    newData = await updateIssueDetail(data, response)
    nextState = syncIssues(cloneAppState(appState), response.returnValues, newData)
    appState = cloneAppState(nextState)
    break
  case 'SubmissionRejected':
    console.log('[Projects] SubmissionRejected', appState, response.returnValues)
    if(!response.returnValues) {
      break
    }
    data = await loadIssueData(response.returnValues)
    data.workStatus = status[3]
    console.log('Data: ', data)
    newData = await updateIssueDetail(data, response)
    nextState = syncIssues(cloneAppState(appState), response.returnValues, newData)
    appState = cloneAppState(nextState)
    break
  case 'WorkSubmitted':
    console.log('[Projects] WorkSubmitted', cloneAppState(appState), response.returnValues)
    if(!response.returnValues) {
      break
    }
    data = await loadIssueData(response.returnValues)
    data.workStatus = status[3]
    console.log('Data: ', data)
    newData = await updateIssueDetail(data, response)
    nextState = syncIssues(cloneAppState(appState), response.returnValues, newData)
    appState = cloneAppState(nextState)
    break
  case 'SubmissionAccepted':
    console.log('[Projects] SubmissionAccepted', appState, response.returnValues)
    if (!response.returnValues) {
      break
    }
    data = await loadIssueData(response.returnValues)
    console.log('Data: ', data)
    data.workStatus = status[4]
    //const workFinishedData = await loadSubmissionData(response.returnValues)
    //data.work = workFinishedData
    nextState = syncIssues(cloneAppState(appState), response.returnValues, data)
    appState = cloneAppState(nextState)
    break
  case 'IssueCurated':
    console.log('[Projects] IssueCurated', response.returnValues)
    nextState = await syncRepos(cloneAppState(appState), response.returnValues)
    appState = cloneAppState(nextState)
    break
  case 'BountySettingsChanged':
    console.log('[Projects] BountySettingsChanged')
    nextState = await syncSettings(cloneAppState(appState)) // No returnValues on this
    appState = cloneAppState(nextState)
    break
  case 'VaultDeposit':
    console.log('[Projects] VaultDeposit')
    nextState = await syncTokens(cloneAppState(appState), response.returnValues)
    appState = cloneAppState(nextState)
  default:
    console.log('[Projects] Unknown event catched:', response)
    nextState = cloneAppState(appState)
  }
  app.cache('state', nextState)
}

async function syncRepos(state, { repoId, ...eventArgs }) {
  console.log('syncRepos: arguments from events:', eventArgs)

  const transform = ({ ...repo }) => ({
    ...repo,
  })
  try {
    let updatedState = await updateState(state, repoId, transform)
    return updatedState
  } catch (err) {
    console.error('updateState failed to return:', err)
  }
}

function syncIssues(state, { issueNumber, ...eventArgs }, data) {
  console.log('syncIssues: arguments from events:', eventArgs, 'state: ', state)

  try {
    let updatedState = updateIssueState(state, issueNumber, data)
    return updatedState
  } catch (err) {
    console.error('updateIssueState failed to return:', err)
  }
}

async function syncSettings(state) {
  try {
    let settings = await loadSettings()
    state.bountySettings = settings
    return state
  } catch (err) {
    console.error('[Projects script] syncSettings settings failed:', err)
  }
}

async function syncTokens(state, { token }) {
  try {
    let tokens = state.tokens
    let tokenIndex = tokens.findIndex(currentToken => currentToken.addr === token)
    if(tokenIndex == -1) {
      let newToken = await loadToken(token)
      tokenIndex = tokens.findIndex(currentToken => currentToken.symbol === newToken.symbol)
      if(tokenIndex !== -1){
        tokens[tokenIndex] = newToken
      } else {
        tokens.push(newToken)
      }
    }
    return state
  } catch (err) {
    console.error('[Projects script] syncSettings settings failed:', err)
    return state
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

const cloneAppState = (nextState) => Object.assign({}, nextState)

async function updateIssueDetail(data, response) {
  let requestsData, submissionData
  requestsData = await loadRequestsData(response.returnValues)
  data.requestsData = requestsData
  if (status.indexOf(data.workStatus) >= SUBMISSION_STAGE) {
    submissionData = await loadSubmissionData(response.returnValues)
    data.workSubmissions = submissionData
    data.work = submissionData[submissionData.length - 1]
  }
  return data
}

function loadToken(token) {
  let tokenContract = app.external(token, tokenAbi)
  return new Promise(resolve => {
    tokenContract.symbol().subscribe(symbol => {
      tokenContract.decimals().subscribe(decimals => {
        resolve({
          addr: token,
          symbol: symbol,
          decimals: decimals,
        })
      })
    })
  })
}

function loadRepoData(id) {
  return new Promise(resolve => {
    app.call('getRepo', id).subscribe(({ owner, index }) => {
      const [ _repo, _owner ] = [ toAscii(id), toAscii(owner) ]
      getRepoData(_repo).then(({ node }) => {
        const commits = node.defaultBranchRef
          ? node.defaultBranchRef.target.history.totalCount
          : 0
        const description = node.description
          ? node.description
          : '(no description available)'
        const metadata = {
          name: node.name,
          url: node.url,
          description: description,
          collaborators: node.collaborators.totalCount,
          commits,
        }
        resolve({ _repo, _owner, index, metadata })
      })
    })
  })
}

function loadIssueData({ repoId, issueNumber }) {
  return new Promise(resolve => {
    app.call('getIssue', repoId, issueNumber).subscribe(async ({ hasBounty, standardBountyId, balance, token, dataHash, assignee }) => {
      const bountyData = await ipfsGet(dataHash)
      resolve({ balance, hasBounty, token, standardBountyId, assignee, ...bountyData })
    })
  })
}

function loadRequestsData({ repoId, issueNumber }) {
  return new Promise(resolve => {
    app.call('getApplicantsLength', repoId, issueNumber).subscribe(async (response) => {
      let applicants = []
      for(let applicantId = 0; applicantId < response; applicantId++){
        applicants.push(await getRequest(repoId, issueNumber, applicantId))
      }
      resolve(applicants)
    })
  })
}

function getRequest(repoId, issueNumber, applicantId) {
  return new Promise(resolve => {
    app.call('getApplicant', repoId, issueNumber, applicantId).subscribe(async (response) => {
      const bountyData = await ipfsGet(response.application)
      resolve({
        contributorAddr: response.applicant,
        status: assignmentRequestStatus[response.status],
        requestIPFSHash: response.application,
        ...bountyData
      })
    })
  })
}

function loadSubmissionData({ repoId, issueNumber }) {
  return new Promise(resolve => {
    app.call('getSubmissionsLength', repoId, issueNumber).subscribe(async (response) => {
      let submissions = []
      console.log('number of submissions: ', response)
      for(let submissionId = 0; submissionId < response; submissionId++){
        submissions.push(await getSubmission(repoId, issueNumber, submissionId))
      }
      resolve(submissions)
    })
  })
}

function getSubmission(repoId, issueNumber, submissionIndex) {
  return new Promise(resolve => {
    console.log(repoId, issueNumber, submissionIndex)
    app.call('getSubmission', repoId, issueNumber, submissionIndex).subscribe(async ({ submissionHash, fulfillmentId, status, submitter }) => {
      const bountyData = await ipfsGet(submissionHash)
      resolve({ status,
        fulfillmentId,
        submitter,
        submissionIPFSHash: submissionHash,
        ...bountyData
      })
    })
  })
}

function loadSettings() {
  return new Promise(resolve => {
    app.call('getSettings').subscribe(settings => {
      resolve(settings)
    })
  })
}

async function checkReposLoaded(repos, id, transform) {
  const repoIndex = repos.findIndex(repo => repo.id === id)
  console.log('this is the repo index:', repoIndex)
  console.log('checkReposLoaded, repoIndex:', repos, id)
  const { metadata, ...data } = await loadRepoData(id)

  if (repoIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    console.log('repo not found in the cache: retrieving from chain')
    return repos.concat(
      await transform({
        id,
        data: { ...data },
        metadata,
      })
    )
  } else {
    console.log('repo found: ' + repoIndex)
    const nextRepos = Array.from(repos)
    nextRepos[repoIndex] = await transform({
      id,
      data: { ...data },
      metadata,
    })
    return nextRepos
  }
}

function checkIssuesLoaded(issues, issueNumber, data) {
  const issueIndex = issues.findIndex(issue => issue.issueNumber === issueNumber)
  console.log('this is the issue index:', issueIndex)
  console.log('checkIssuesLoaded, issueNumber:', issues, issueNumber)
  console.log('loadIssueData:', data)

  if (issueIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    console.log('issue not found in the cache: retrieving from chain')
    return issues.concat({
      issueNumber,
      data: data
    })
  } else {
    console.log('issue found: ' + issueIndex)
    const nextIssues = Array.from(issues)
    nextIssues[issueIndex] = {
      issueNumber,
      data: data
    }
    return nextIssues
  }
}

let unloadedRepoQueue = []
async function updateState(state, id, transform) {
  console.log('update state: ' + state + ', id: ' + id)
  const { repos, tokens, bountySettings, issues } = determineStateVars(state)
  let newRepos
  try {
    if (client && client.request) {
      newRepos = await checkReposLoaded(repos, id, transform)
      const newState = { tokens, repos: newRepos, bountySettings, issues }
      return newState
    } else {
      unloadedRepoQueue.push(id)
      return { tokens, repos, bountySettings, issues }
    }
  } catch (err) {
    console.error(
      'Update repos failed to return:',
      err,
      'here\'s what returned in NewRepos',
      newRepos
    )
  }
}

function updateIssueState(state, issueNumber, data) {
  console.log('update state: ', state, ', data: ', data)
  if(data === undefined || data === null) {
    return state
  }
  const { repos, tokens, bountySettings, issues } = determineStateVars(state)

  try {
    let newIssues = checkIssuesLoaded(issues, issueNumber, data)
    let newState = { repos, tokens, bountySettings, issues: newIssues }
    return newState
  } catch (err) {
    console.error(
      'Update issues failed to return:',
      err,
      'here\'s what returned in newIssues',
      newIssues
    )
  }
}
