import Aragon from '@aragon/api'

import { GraphQLClient } from 'graphql-request'
import tokenSymbolAbi from '../abi/token-symbol.json'
import tokenDecimalsAbi from '../abi/token-decimal.json'
import { ipfsGet } from '../utils/ipfs-helpers'

import { REQUESTING_GITHUB_TOKEN,
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_TOKEN_FAILURE,
  INITIALIZE_STORE } from './eventTypes'
import { INITIAL_STATE } from './'

import { STATUS } from '../utils/github'

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

let apolloClient = null
const getRepoData = repo => {
  try {
    let data = apolloClient.request(repoData(repo))
    return data
  } catch (err) {
    console.error('getRepoData failed: ', err)
  }
}

const initializeApolloClient = token => {
  apolloClient = new GraphQLClient('https://api.github.com/graphql', {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
}

const loadReposFromQueue = async (state) => {
  if (unloadedRepoQueue && unloadedRepoQueue.length > 0) {
    const loadedRepoQueue = await Promise.all(unloadedRepoQueue.map(
      async repoId => {
        const { repos } = await syncRepos(state, { repoId })
        return repos[0]
      }
    ))
    return loadedRepoQueue
  }
  return []
}


async function syncRepos(state, { repoId }) {
  const transform = ({ ...repo }) => ({
    ...repo,
  })
  try {
    let updatedState = await updateState(state, repoId, transform)
    return updatedState
  } catch (err) {
    console.error('updateState failed to return:', err)
    return state
  }
}

function syncIssues(state, { issueNumber, ...eventArgs }, data) {
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
  let returnData = { ...data }
  let requestsData = await loadRequestsData(response.returnValues)
  returnData.requestsData = requestsData
  if (status.indexOf(data.workStatus) >= SUBMISSION_STAGE) {
    let submissionData = await loadSubmissionData(response.returnValues)
    returnData.workSubmissions = submissionData
    returnData.work = submissionData[submissionData.length - 1]
  }
  return returnData
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
      for(let submissionId = 0; submissionId < response; submissionId++){
        submissions.push(await getSubmission(repoId, issueNumber, submissionId))
      }
      resolve(submissions)
    })
  })
}

function getSubmission(repoId, issueNumber, submissionIndex) {
  return new Promise(resolve => {
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
  const { metadata, ...data } = await loadRepoData(id)

  if (repoIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    return repos.concat(
      await transform({
        id,
        data: { ...data },
        metadata,
      })
    )
  } else {
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

  if (issueIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    return issues.concat({
      issueNumber,
      data: data
    })
  } else {
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
  try {
    if (apolloClient) {
      const repos = await checkReposLoaded(state.repos, id, transform)
      const newState = { ...state, repos }
      return newState
    }

    // if the user hasn't logged in to github, add the repos to a queue to load later
    unloadedRepoQueue.push(id)
    return state
  } catch (err) {
    console.error(
      'Update repos failed to return:',
      err,
      'here\'s what returned in NewRepos',

    )
  }
}

function updateIssueState(state, issueNumber, data) {
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


export const handleEvent = async (state, action) => {
  // if (eventName === INITIALIZATION_TRIGGER) {
  //   // nextState = await initializeTokens(nextState, settings)
  // }

  const { event, returnValues, address } = action
  let nextState = { ...state }

  switch (event) {
  case INITIALIZE_STORE: {
    nextState = { ...INITIAL_STATE, ...state }
    if (nextState.github.token) {
      initializeApolloClient(nextState.github.token)
    }
    return nextState
  }
  case REQUESTING_GITHUB_TOKEN: {
    return state
  }
  case REQUESTED_GITHUB_TOKEN_SUCCESS: {
    const { token } = action
    if (token) {
      initializeApolloClient(token)
    }

    const loadedRepos = await loadReposFromQueue(state)

    const status = STATUS.AUTHENTICATED
    const github = {
      token,
      status,
      event: null
    }

    const repos = [ ...state.repos, ...loadedRepos ]

    return { ...nextState, github, repos }
  }
  case REQUESTED_GITHUB_TOKEN_FAILURE: {
    return state
  }
  case 'RepoAdded': {
    nextState = await syncRepos(nextState, returnValues)
    return nextState
  }
  case 'RepoRemoved':
    const id = returnValues.repoId
    const repoIndex = nextState.repos.findIndex(repo => repo.id === id)
    if (repoIndex === -1) return nextState
    nextState.repos.splice(repoIndex,1)
    return nextState
  case 'RepoUpdated':
    nextState = await syncRepos(cloneAppState(appState), returnValues)
    return nextState
  case 'BountyAdded': {
    if(!returnValues) return nextState
    const issueData = await loadIssueData(returnValues)
    issueData.workStatus = status[0]
    nextState = syncIssues(nextState, returnValues, issueData, [])
    return nextState
  }
  case 'AssignmentRequested': {
    if(!returnValues) return nextState
    const issueData = await loadIssueData(returnValues)
    issueData.workStatus = status[1]
    const newData = await updateIssueDetail(issueData, action)
    nextState = syncIssues(nextState, returnValues, newData)
    return nextState
  }
  case 'AssignmentApproved': {
    if(!returnValues) return nextState
    const issueData = await loadIssueData(returnValues)
    issueData.workStatus = status[2]
    const newData = await updateIssueDetail(issueData, action)
    nextState = syncIssues(nextState, returnValues, newData)
    return nextState
  }
  case 'SubmissionRejected': {
    if(!returnValues) return nextState
    const issueData = await loadIssueData(returnValues)
    issueData.workStatus = status[3]
    const newData = await updateIssueDetail(issueData, action)
    nextState = syncIssues(nextState, returnValues, newData)
    return nextState
  }
  case 'WorkSubmitted': {
    if(!returnValues) return nextState
    const issueData = await loadIssueData(returnValues)
    issueData.workStatus = status[3]
    const newData = await updateIssueDetail(issueData, action)
    nextState = syncIssues(nextState, returnValues, newData)
    return nextState
  }
  case 'SubmissionAccepted': {
    if (!returnValues) return nextState
    const issueData = await loadIssueData(returnValues)
    issueData.workStatus = status[4]
    nextState = syncIssues(nextState, returnValues, issueData)
    return nextState
  }
  case 'IssueCurated': {
    nextState = await syncRepos(nextState, returnValues)
    return nextState
  }
  case 'BountySettingsChanged':
    nextState = await syncSettings(nextState) // No returnValues on this
    return nextState
  case 'VaultDeposit':
    nextState = await syncTokens(nextState, returnValues)
    return nextState
  default:
    return nextState
  }
}
