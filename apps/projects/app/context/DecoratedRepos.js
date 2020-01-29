import React from 'react'
import { useAragonApi } from '../api-react'
import { GraphQLClient } from 'graphql-request'

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
      milestones(first: 100) {
        edges {
          node {
            id
            title
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

  React.useEffect(() => {
    if (!github.token) return

    async function fetchGithubData() {
      const client = new GraphQLClient('https://api.github.com/graphql', {
        headers: {
          Authorization: 'Bearer ' + github.token,
        },
      })

      setDecoratedRepos(await Promise.all(
        // initial repo shape:
        // {
        //   id: repoIdHex,
        //   data: { _repo: repoIdAscii },
        // },
        repos.map(repo => client.request(repoQuery(repo.data._repo))
          .then(({ node }) => ({
            id: repo.id,
            data: { _repo: repo.data._repo },
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
              }, {}),
              milestones: node.milestones.edges.reduce((map, milestone) => {
                map[milestone.node.id] = milestone.node
                return map
              }, {}),
            },
          }))
          .catch(err => ({
            id: repo.id,
            data: { _repo: repo.data._repo },
            metadata: {
              name: JSON.stringify(err),
              url: '',
              description: '',
              collaborators: 0,
              commits: 0,
            },
          }))
        )
      ))
    }

    fetchGithubData()
  }, [ github.token, repos ])

  return <DecoratedReposContext.Provider value={decoratedRepos} {...props} />
}
