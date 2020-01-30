import React from 'react'
import { useAragonApi } from '../api-react'
import { GraphQLClient } from 'graphql-request'
import { ipfsGet } from '../utils/ipfs-helpers'

const repoQuery = repoId => `{
  node(id: "${repoId}") {
    ... on Repository {
      name
      url
      description
      owner { login }
      labels(first: 100) {
        totalCount
        edges {
          node {
            id
            name
            color
          }
        }
      }
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

const DecoratedReposContext = React.createContext()

export function useDecoratedRepos() {
  const context = React.useContext(DecoratedReposContext)
  if (!context) {
    throw new Error('useDecoratedRepos must be used within a DecoratedReposProvider')
  }
  return context
}

export function DecoratedReposProvider(props) {
  const { appState: { github, repos } } = useAragonApi()
  const [ decoratedRepos, setDecoratedRepos ] = React.useState([])

  // The structure below should be common for all sources of issues.
  // Because in the future there can be more sources than native and GH,
  // each with its own fetchData function, fetchDecoupledData()
  // was added as new and separate function instead adding its functionality
  // to fetchGithubData()
  //
  // initial repo shape:
  // {
  //   id: repoIdHex,
  //   decoupled: repo.data.decoupled,
  //   data: { _repo: repoIdAscii },
  // },

  React.useEffect(() => {
    async function fetchDecoupledData() {
      return await Promise.all(
        repos
          .filter(repo => repo.data.decoupled)
          .map(async repo => {
            try {
              const node = await ipfsGet(repo.data.repoData)
              return ({
                id: repo.id,
                decoupled: repo.data.decoupled,
                data: { _repo: repo.data._repo },
                index: repo.data.index,
                metadata: {
                  name: node.title,
                  url: '/projects/' + repo.id,
                  description: node.description,
                },
              })
            }
            catch(err) {
              return ({
                id: repo.id,
                decoupled: repo.data.decoupled,
                data: { _repo: repo.data._repo },
                index: repo.data.index,
                metadata: {
                  name: '-',
                  url: '',
                  description: err.message,
                },
              })
            }
          })
      )
    }

    async function fetchGithubData() {
      const client = new GraphQLClient('https://api.github.com/graphql', {
        headers: {
          Authorization: 'Bearer ' + github.token,
        },
      })

      return await Promise.all(
        repos
          .filter(repo => !repo.data.decoupled)
          .map(repo => {
            return client.request(repoQuery(repo.data._repo))
              .then(({ node }) => ({
                id: repo.id,
                decoupled: repo.data.decoupled,
                data: { _repo: repo.data._repo },
                index: repo.data.index,
                metadata: {
                  name: node.name,
                  owner: node.owner.login,
                  url: node.url,
                  description: node.description
                    ? node.description
                    : '(no description available)',
                  // TODO: disabled for now (apparently needs push permission on the repo to work)
                  collaborators: 0, //node.collaborators.totalCount,
                  commits: node.defaultBranchRef
                    ? node.defaultBranchRef.target.history.totalCount
                    : 0,
                  labels: node.labels.edges.reduce((map, label) => {
                    map[label.node.id] = label.node
                    return map
                  }),
                },
              }))
              .catch(err => ({
                id: repo.id,
                decoupled: repo.data.decoupled,
                data: { _repo: repo.data._repo },
                index: repo.data.index,
                metadata: {
                  name: '-',
                  url: '',
                  description: JSON.stringify(err),
                },
              }))
          })
      )
    }

    const decorateAllRepos = async () => {
      const a = await fetchDecoupledData()
      const b = github.token ? await fetchGithubData() : []
      setDecoratedRepos([ ...a, ...b ])
    }

    decorateAllRepos()
  }, [ github.token, repos ])

  return <DecoratedReposContext.Provider value={decoratedRepos} {...props} />
}
