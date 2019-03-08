import Aragon from '@aragon/client'

import { GraphQLClient } from 'graphql-request'
import { STATUS } from './utils/github'
import vaultAbi from '../../shared/json-abis/vault'
import tokenSymbolAbi from './abi/token-symbol.json'
import tokenDecimalsAbi from './abi/token-decimal.json'

let ipfsClient = require('ipfs-http-client')

const tokenAbi = [].concat(tokenDecimalsAbi, tokenSymbolAbi)

let ipfs = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' })

const status = [ 'new', 'review-applicants', 'submit-work', 'review-work', 'finished' ]

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

const app = new Aragon()
let appState, vault, bounties, tokens

/**
 * Observe the github object.
 * @return {Observable} An observable of github object over time.
 */
const github = () => {
  return app.rpc
    .sendAndObserveResponses('cache', [ 'get', 'github' ])
    .pluck('result')
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

// TODO: Handle cases where checking validity of token fails (revoked, etc)

github().subscribe(result => {
  console.log('github object received from cache:', result)
  if (result) {
    result.token && initClient(result.token)
    return
  } else app.cache('github', { status: STATUS.INITIAL })
})

app.events().subscribe(handleEvents)

app.state().subscribe(state => {
  state && console.log('[Projects script] state subscription:\n', state)
  appState = state ? state : { repos: [], bountySettings: {}, tokens: [] }
  if (!vault) {
    // this should be refactored to be a "setting"
    app.call('vault').subscribe(response => {
      vault = app.external(response, vaultAbi.abi)
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
    console.log('[Projects] event RepoAdded')
    nextState = await syncRepos(appState, response.returnValues)
    break
  case 'RepoRemoved':
    console.log('[Projects] RepoRemoved', response.returnValues)
    const id = response.returnValues.repoId
    const repoIndex = appState.repos.findIndex(repo => repo.id === id)
    if (repoIndex === -1) break
    appState.repos.splice(repoIndex,1)
    nextState = appState
    break
  case 'RepoUpdated':
    console.log('[Projects] RepoUpdated', response.returnValues)
    nextState = await syncRepos(appState, response.returnValues)
  case 'BountyAdded':
    console.log('[Projects] BountyAdded', appState, response.returnValues)
    if(!response.returnValues) {
      break
    }
    data = await loadIssueData(response.returnValues)
    data.workStatus = status[0]
    nextState = syncIssues(appState, response.returnValues, data, [])
    appState = nextState
    break
  case 'AssignmentRequested':
    console.log('[Projects] AssignmentRequested', appState, response.returnValues)
    if(!response.returnValues) {
      break
    }
    data = await loadIssueData(response.returnValues)
    data.workStatus = status[1]
    newData = await updateIssueDetail(data, response)
    nextState = syncIssues(appState, response.returnValues, newData)
    appState = nextState
    break
  case 'AssignmentApproved':
    console.log('[Projects] AssignmentApproved', appState, response.returnValues)
    if(!response.returnValues) {
      break
    }
    data = await loadIssueData(response.returnValues)
    data.workStatus = status[2]
    newData = await updateIssueDetail(data, response)
    nextState = syncIssues(appState, response.returnValues, newData)
    appState = nextState
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
    nextState = syncIssues(appState, response.returnValues, newData)
    appState = nextState
    break
  case 'WorkSubmitted':
    console.log('[Projects] WorkSubmitted', appState, response.returnValues)
    if(!response.returnValues) {
      break
    }
    data = await loadIssueData(response.returnValues)
    data.workStatus = status[3]
    console.log('Data: ', data)
    newData = await updateIssueDetail(data, response)
    nextState = syncIssues(appState, response.returnValues, newData)
    appState = nextState
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
    nextState = syncIssues(appState, response.returnValues, data)
    appState = nextState
    break
  case 'IssueCurated':
    console.log('[Projects] IssueCurated', response.returnValues)
    nextState = await syncRepos(appState, response.returnValues)
    break
  case 'BountySettingsChanged':
    console.log('[Projects] BountySettingsChanged')
    nextState = await syncSettings(appState) // No returnValues on this
    break
  case 'VaultDeposit':
    console.log('[Projects] VaultDeposit')
    nextState = await syncTokens(appState, response.returnValues)
  default:
    console.log('[Projects] Unknown event catched:', response)
  }
  if(nextState) {
    app.cache('state', nextState)
  }
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
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

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
    app.call('getIssue', repoId, issueNumber).subscribe(({ hasBounty, standardBountyId, balance, token, dataHash, assignee }) => {
      let contentJSON
      ipfs.get(dataHash, (err, files) => {
        for(const file of files) {
          contentJSON = JSON.parse(file.content.toString('utf8'))
        }
        resolve({ balance, hasBounty, token, standardBountyId, assignee, ...contentJSON })
      })
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
    app.call('getApplicant', repoId, issueNumber, applicantId).subscribe( async (response) => {
      let contentJSON
      console.log('getApplicant response: ', response)
      ipfs.get(response.application, (err, files) => {
        for(const file of files) {
          contentJSON = JSON.parse(file.content.toString('utf8'))
        }
        resolve({ contributorAddr: response.applicant, requestIPFSHash: response.application, ...contentJSON })
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
      let contentJSON
      ipfs.get(submissionHash, (err, files) => {
        for(const file of files) {
          contentJSON = JSON.parse(file.content.toString('utf8'))
        }
        console.log('submissionData: ', { status, fulfillmentId, submitter, ...contentJSON })
        resolve({ status, fulfillmentId, submitter, submissionIPFSHash: submissionHash, ...contentJSON })
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

async function updateState(state, id, transform) {
  console.log('update state: ' + state + ', id: ' + id)
  const { repos = [] } = state
  try {
    let newRepos = await checkReposLoaded(repos, id, transform)
    let newState = { ...state, repos: newRepos }
    return newState
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
  const { issues = [] } = state
  try {
    let newIssues = checkIssuesLoaded(issues, issueNumber, data)
    let newState = { ...state, issues: newIssues }
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
