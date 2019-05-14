import { GraphQLClient } from 'graphql-request'

import { app } from '../app'

let unloadedRepoQueue = []

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
        }
      }
}`

// collaborators {
//   totalCount
// }

let graphQLClient = null

export const initializeGraphQLClient = token => {
  graphQLClient = new GraphQLClient('https://api.github.com/graphql', {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
}

const getRepoData = repo => {
  try {
    let data = graphQLClient.request(repoData(repo))
    return data
  } catch (err) {
    console.error('getRepoData failed: ', err)
  }
}

const loadRepoData = id => {
  return new Promise(async(resolve) => {
    app.call('isRepoAdded', id).subscribe(isAddedResponse => {
      if(!isAddedResponse) {
        return resolve({ repoRemoved: true })
      }
      app.call('getRepo', id).subscribe(response => {
      // handle repo removed case
        if (!response) return resolve({ repoRemoved: true })

        const _repo = toAscii(id)
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
            // TODO: disabled for now (apparently needs push permission on the repo to work)
            collaborators: 0, //node.collaborators.totalCount,
            commits,
          }
          return resolve({
            _repo,
            index: response.index,
            metadata,
            repoRemoved: false,
          })
        })
      })
    })
  })
}

const checkReposLoaded = async (repos, id, transform) => {
  const repoIndex = repos.findIndex(repo => repo.id === id)
  const { metadata, repoRemoved, ...data } = await loadRepoData(id)

  if (repoRemoved) return repos

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

const updateState = async (state, id, transform) => {
  try {
    if (graphQLClient) {
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
      'here\'s what returned in NewRepos'
    )
  }
}

export const syncRepos = async (state, { repoId }) => {
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

export const loadReposFromQueue = async state => {
  if (unloadedRepoQueue && unloadedRepoQueue.length > 0) {
    const loadedRepoQueue = await Promise.all(
      unloadedRepoQueue.map(async repoId => {
        const { repos } = await syncRepos(state, { repoId })
        return repos[0]
      })
    )
    // don't put a removed repo in state as `null`
    return loadedRepoQueue.filter(repo => !!repo)
  }
  return []
}
