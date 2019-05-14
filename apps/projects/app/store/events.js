import {
  REQUESTING_GITHUB_TOKEN,
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_TOKEN_FAILURE,
  REQUESTED_GITHUB_DISCONNECT,
  INITIALIZE_STORE,
  INITIALIZE_VAULT,
  REPO_ADDED,
  REPO_REMOVED,
  BOUNTY_ADDED,
  ASSIGNMENT_REQUESTED,
  ASSIGNMENT_APPROVED,
  SUBMISSION_REJECTED,
  WORK_SUBMITTED,
  SUBMISSION_ACCEPTED,
  ISSUE_CURATED,
  BOUNTY_SETTINGS_CHANGED,
  VAULT_DEPOSIT,
} from './eventTypes'

import { INITIAL_STATE } from './'

import {
  initializeGraphQLClient,
  initializeTokens,
  syncRepos,
  loadReposFromQueue,
  loadIssueData,
  determineWorkStatus,
  updateIssueDetail,
  syncIssues,
  syncTokens,
  syncSettings
} from './helpers'

import { STATUS } from '../utils/github'

export const handleEvent = async (state, action, vaultAddress, vaultContract) => {
  const { event, returnValues, address } = action
  let nextState = { ...state }

  switch (event) {
  case INITIALIZE_STORE: {
    nextState = { ...INITIAL_STATE, ...state }
    if (nextState.github.token) {
      initializeGraphQLClient(nextState.github.token)
    }
    return nextState
  }
  case INITIALIZE_VAULT: {
    return nextState = await initializeTokens(state, vaultContract)
  }
  case REQUESTING_GITHUB_TOKEN: {
    return state
  }
  case REQUESTED_GITHUB_TOKEN_SUCCESS: {
    const { token } = action
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
  case REPO_REMOVED:
    const id = returnValues.repoId
    const repoIndex = nextState.repos.findIndex(repo => repo.id === id)
    if (repoIndex === -1) return nextState
    nextState.repos.splice(repoIndex,1)
    return nextState
  case BOUNTY_ADDED: {
    if(!returnValues) return nextState
    let issueData = await loadIssueData(returnValues)
    issueData = determineWorkStatus(issueData, BOUNTY_ADDED)
    nextState = syncIssues(nextState, returnValues, issueData, [])
    return nextState
  }
  case ASSIGNMENT_REQUESTED: {
    if(!returnValues) return nextState
    let issueData = await loadIssueData(returnValues)
    issueData = await updateIssueDetail(issueData, action)
    issueData = determineWorkStatus(issueData, ASSIGNMENT_REQUESTED)
    nextState = syncIssues(nextState, returnValues, issueData)
    return nextState
  }
  case ASSIGNMENT_APPROVED: {
    if(!returnValues) return nextState
    let issueData = await loadIssueData(returnValues)
    issueData = await updateIssueDetail(issueData, action)
    issueData = determineWorkStatus(issueData, ASSIGNMENT_APPROVED)
    nextState = syncIssues(nextState, returnValues, issueData)
    return nextState
  }
  case SUBMISSION_REJECTED: {
    if(!returnValues) return nextState
    let issueData = await loadIssueData(returnValues)
    issueData = await updateIssueDetail(issueData, action)
    issueData = determineWorkStatus(issueData, SUBMISSION_REJECTED)
    nextState = syncIssues(nextState, returnValues, issueData)
    return nextState
  }
  case WORK_SUBMITTED: {
    if(!returnValues) return nextState
    let issueData = await loadIssueData(returnValues)
    issueData = await updateIssueDetail(issueData, action)
    issueData = determineWorkStatus(issueData, WORK_SUBMITTED)
    nextState = syncIssues(nextState, returnValues, issueData)
    return nextState
  }
  case SUBMISSION_ACCEPTED: {
    if (!returnValues) return nextState
    let issueData = await loadIssueData(returnValues)
    issueData = await updateIssueDetail(issueData, action)
    issueData = determineWorkStatus(issueData, SUBMISSION_ACCEPTED)
    nextState = syncIssues(nextState, returnValues, issueData)
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
