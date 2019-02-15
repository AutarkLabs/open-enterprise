import Aragon, { providers } from '@aragon/client'
import { first, of } from 'rxjs' // Make sure observables have .first
import { combineLatest } from 'rxjs'
import { empty } from 'rxjs/observable/empty'

import { GraphQLClient } from 'graphql-request'
import { STATUS } from './utils/github'
import VaultJSON from '../build/contracts/Vault.json'
import tokenSymbolAbi from './abi/token-symbol.json'
import { isNullOrUndefined } from 'util'

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
    .sendAndObserveResponses('cache', ['get', 'github'])
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
      vault = app.external(response, VaultJSON.abi)
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
  let nextState
  switch (response.event) {
  case 'RepoAdded':
    console.log('[Projects] event RepoAdded')
    nextState = await syncRepos(appState, response.returnValues)
    break
  case 'RepoRemoved':
    console.log('[Projects] RepoRemoved', response.returnValues)
    nextState = await syncRepos(appState, response.returnValues)
    break
  case 'RepoUpdated':
    console.log('[Projects] RepoUpdated', response.returnValues)
    nextState = await syncRepos(appState, response.returnValues)
  case 'BountyAdded':
    console.log('[Projects] BountyAdded', response.returnValues)
    nextState = await syncIssues(appState, response.returnValues)
    console.log('Bounty Added State Change', nextState)
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

async function syncIssues(state, { repoId, issueNumber, ...eventArgs }) {
  console.log('syncIssues: arguments from events:', eventArgs)

  const transform = ({ ...repo }) => ({
    ...repo,
  })
  try {
    let updatedState = await updateIssueState(state, repoId, issueNumber, transform)
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

async function syncTokens(state, {token}) {
  try {
    let tokens = state.tokens
    const tokenIndex = tokens.findIndex(token => token.addr === token)
    if(tokenIndex == -1) {
      let newToken = await loadToken(token)
      tokens.push(newToken)
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


function loadToken(token) {
  let tokenContract = app.external(token, tokenSymbolAbi)
  return new Promise(resolve => {
    tokenContract.symbol().subscribe(symbol => {
      // return gracefully when entry not found
      symbol &&
        resolve({
          addr: token,
          symbol: symbol
        })
    })
  })
}

function loadRepoData(id) {
  return new Promise(resolve => {
    app.call('getRepo', id).subscribe(({ owner, index }) => {
      const [_repo, _owner] = [toAscii(id), toAscii(owner)]
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

function loadIssueData(repoId, issueNumber) {
  return new Promise(resolve => {
    app.call('getIssue', repoId, issueNumber).subscribe(({ hasBounty, standardBountyId, balance, token}) => {
      const [_repo, _issueNumber] = [toAscii(repoId), toAscii(issueNumber)]
      resolve({ _repo, _issueNumber, balance, hasBounty, token, standardBountyId})
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

async function checkIssuesLoaded(issues, repoId, issueNumber, transform) {
  const issueIndex = issues.findIndex(issue => issue.issueNumber === issueNumber)
  console.log('this is the issue index:', issueIndex)
  console.log('checkIssuesLoaded, issueNumber:', issues, issueNumber)
  const data = await loadIssueData(repoId, issueNumber)
  console.log('loadIssueData:', data)

  if (issueIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    console.log('issue not found in the cache: retrieving from chain')
    return issues.concat(
      await transform({
        issueNumber,
        data: data
      })
    )
  } else {
    console.log('issue found: ' + issueIndex)
    const nextIssues = Array.from(issues)
    nextIssues[issueIndex] = await transform({
      issueNumber,
      data: data
    })
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

async function updateIssueState(state, repoId, issueNumber, transform) {
  console.log('update state: ', state, ', id: ', repoId)
  const { issues = [] } = state
  try {
    let newIssues = await checkIssuesLoaded(issues, repoId, issueNumber, transform)
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
