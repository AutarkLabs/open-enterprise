import Aragon, { providers } from '@aragon/client'
import { first, of } from 'rxjs' // Make sure observables have .first
import { combineLatest } from 'rxjs'
import { empty } from 'rxjs/observable/empty'

import { GraphQLClient } from 'graphql-request'
import { STATUS } from './utils/github'

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
let appState

/**
 * Observe the github object.
 * @return {Observable} An observable of github object over time.
 */
const github = () => {
  return app.rpc
    .sendAndObserveResponses('cache', ['get', 'github'])
    .pluck('result')
}

const bountySettings = () => {
  return app.rpc
    .sendAndObserveResponses('cache', ['get', 'bountySettings'])
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

bountySettings().subscribe(result => {
  console.log('script.js bountySettings object received from cache:', result)
  // TODO: If we don't receive the bountySettings that are hardcoded into the smart contract we should not continue silently, it must be a bad signal
  // ...So we must break with an error at least, and never create an empty bounty settings object that will generate more problems for sure
  // TODO: We probably also want to handle clearing the cache
  // TODO: What is the source of truth for these settings? the contract o the cached values? is not clear at all. the github settings instead just exist in cache.
  if (!result) {
    console.error(
      'Something is wrong and we didn\'t received the expected hardcoded bountySettings from the contract'
    )
    // app.cache('bountySettings', {})
  }
})

app.events().subscribe(handleEvents)

app.state().subscribe(state => {
  console.log('Projects: entered state subscription:\n', state)
  appState = state ? state : { repos: [] }
})

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function handleEvents(response) {
  console.log(response)
  let nextState
  switch (response.event) {
  case 'RepoAdded':
    nextState = await syncRepos(appState, response.returnValues)
    console.log('RepoAdded Received', response.returnValues, nextState)
    break
  case 'RepoRemoved':
    nextState = await syncRepos(appState, response.returnValues)
    console.log('RepoRemoved Received', response.returnValues, nextState)
    break
  case 'BountyAdded':
    nextState = await syncRepos(appState, response.returnValues)
    console.log('BountyAdded Received', response.returnValues, nextState)
    break
  case 'BountySettingsChanged':
    app.cache('bountySettings', response.returnValues)
    nextState = { ...appState, bountySettings: response.returnValues }
    break
  default:
    console.log('Unknown event catched:', response)
  }
  app.cache('state', nextState)
}

async function syncRepos(state, { repoId, ...eventArgs }) {
  console.log('syncRepos: arguments from events:', ...eventArgs)

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

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

function loadRepoData(id) {
  return new Promise(resolve => {
    console.log('loadRepoData Promise entered: ' + id)
    combineLatest(app.call('getRepo', id)).subscribe(([{ _owner, _repo }]) => {
      let [owner, repo] = [toAscii(_owner), toAscii(_repo)]
      getRepoData(repo).then(({ node }) => {
        let commits = node.defaultBranchRef ? node.defaultBranchRef.commits : 0
        let description = node.description
          ? node.description
          : '(no description available)'
        let metadata = {
          name: node.name,
          description: node.description,
          collaborators: node.collaborators.totalCount,
          commits,
          id,
        }
        resolve({ owner, repo, metadata })
      })
    })
  })
}

async function checkReposLoaded(repos, id, transform) {
  const repoIndex = repos.findIndex(repo => repo.id === id)
  console.log('checkReposLoaded, repoIndex:', repos, id)
  const { metadata, ...data } = await loadRepoData(id)

  if (repoIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    console.log('repo not found: retrieving from chain')
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
