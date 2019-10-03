import { ipfsGet } from '../utils/ipfs-helpers'

import {
  ACTION_PERFORMED,
  REQUESTING_GITHUB_TOKEN,
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_TOKEN_FAILURE,
  REQUESTED_GITHUB_DISCONNECT,
  REPO_ADDED,
  REPO_REMOVED,
  BOUNTY_ADDED,
  ASSIGNMENT_REQUESTED,
  ASSIGNMENT_APPROVED,
  ASSIGNMENT_REJECTED,
  BOUNTY_FULFILLED,
  BOUNTY_SETTINGS_CHANGED,
  VAULT_DEPOSIT,
} from './eventTypes'

import { INITIAL_STATE } from './'

import {
  initializeGraphQLClient,
  syncRepos,
  loadReposFromQueue,
  loadIssueData,
  loadIpfsData,
  buildSubmission,
  determineWorkStatus,
  updateIssueDetail,
  syncIssues,
  syncTokens,
  syncSettings
} from './helpers'

import { STATUS } from '../utils/github'

import { app } from './app'

export const handleEvent = async (state, action, vaultAddress, vaultContract) => {
  const { event, returnValues, address } = action
  let nextState = { ...state }

  switch (event) {
  case REQUESTING_GITHUB_TOKEN: {
    return state
  }
  case REQUESTED_GITHUB_TOKEN_SUCCESS: {
    const { token } = returnValues
    if (token) {
      initializeGraphQLClient(token)
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
  case REQUESTED_GITHUB_DISCONNECT: {
    const { github } = INITIAL_STATE
    nextState = { ...state, github }
    return nextState
  }
  case REPO_ADDED: {
    nextState = await syncRepos(nextState, returnValues)
    return nextState
  }
  case REPO_REMOVED: {
    const id = returnValues.repoId
    const repoIndex = nextState.repos.findIndex(repo => repo.id === id)
    if (repoIndex === -1) return nextState
    nextState.repos.splice(repoIndex,1)
    return nextState
  }
  case BOUNTY_ADDED: {
    if(!returnValues) return nextState
    const { repoId, issueNumber, ipfsHash } = returnValues
    const ipfsData = await loadIpfsData(ipfsHash)
    let issueData = await loadIssueData({ repoId, issueNumber })
    issueData = { ...issueData, ...ipfsData }
    issueData = determineWorkStatus(issueData)
    nextState = syncIssues(nextState, returnValues, issueData, [])
    return nextState
  }
  case ASSIGNMENT_REQUESTED: {
    if(!returnValues) return nextState
    const { repoId, issueNumber } = returnValues
    let issueData = await loadIssueData({ repoId, issueNumber })
    issueData = await updateIssueDetail(issueData)
    issueData = determineWorkStatus(issueData)
    nextState = syncIssues(nextState, returnValues, issueData)
    return nextState
  }
  case ASSIGNMENT_APPROVED: {
    if(!returnValues) return nextState
    const { repoId, issueNumber } = returnValues
    let issueData = await loadIssueData({ repoId, issueNumber })
    issueData = await updateIssueDetail(issueData)
    issueData = determineWorkStatus(issueData)
    nextState = syncIssues(nextState, returnValues, issueData)
    return nextState
  }
  case ASSIGNMENT_REJECTED: {
    if(!returnValues) return nextState
    const { repoId, issueNumber } = returnValues
    let issueData = await loadIssueData({ repoId, issueNumber })
    issueData = await updateIssueDetail(issueData)
    issueData = determineWorkStatus(issueData)
    nextState = syncIssues(nextState, returnValues, issueData)
    return nextState
  }
  case BOUNTY_FULFILLED: {
    if(!returnValues) return nextState
    const { _bountyId, _fulfillmentId, _fulfillers, _submitter, _data } = returnValues
    const issue = nextState.issues.find(i => i.data.standardBountyId === _bountyId)
    if (!issue) return nextState

    if (
      issue.data.workSubmissions &&
      issue.data.workSubmissions[_fulfillmentId] &&
      issue.data.workSubmissions[_fulfillmentId].review
    ) {
      // this indicates that blocks are being processed out of order,
      // and ACTION_PERFORMED has already marked this submission as reviewed
      return nextState
    }

    const issueNumber = String(issue.data.number)
    const submission = await buildSubmission({
      fulfillmentId: _fulfillmentId,
      fulfillers: _fulfillers,
      submitter: _submitter,
      ipfsHash: _data,
    })

    const workSubmissions = issue.data.workSubmissions || []
    workSubmissions[_fulfillmentId] = submission

    let issueData = {
      ...issue.data,
      workSubmissions,
      work: submission,
    }
    issueData = await updateIssueDetail(issueData)
    issueData = determineWorkStatus(issueData)
    nextState = syncIssues(nextState, { issueNumber }, issueData)
    return nextState
  }
  case ACTION_PERFORMED: {
    if (!returnValues) return nextState
    const { _bountyId, _data, _fulfiller } = returnValues
    const { appAddress } = await app.currentApp().toPromise()
    if (_fulfiller.toLowerCase() !== appAddress.toLowerCase()) return nextState

    const issue = nextState.issues.find(i =>
      i.data.standardBountyId === _bountyId
    )
    if (!issue) return nextState

    const ipfsData = await ipfsGet(_data)

    // we only care about ActionPerformed when called in ReviewSubmission
    if (!ipfsData.fulfillmentId) return nextState

    const workSubmissions = issue.data.workSubmissions || []
    workSubmissions[ipfsData.fulfillmentId] = ipfsData

    let issueData = {
      ...issue.data,
      workSubmissions,
      work: ipfsData,
    }
    issueData = await updateIssueDetail(issueData)
    issueData = determineWorkStatus(issueData)
    const issueNumber = String(issue.data.number)
    nextState = syncIssues(nextState, { issueNumber }, issueData)
    return nextState
  }
  case BOUNTY_SETTINGS_CHANGED:
    nextState = await syncSettings(nextState) // No returnValues on this
    nextState = await syncTokens(nextState, { token: nextState.bountySettings.bountyCurrency }, vaultContract )
    return nextState
  case VAULT_DEPOSIT:
    if (vaultAddress !== address) return nextState
    nextState = await syncTokens(nextState, returnValues, vaultContract)
    return nextState
  default:
    return nextState
  }
}
