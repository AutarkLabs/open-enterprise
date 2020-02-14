import React from 'react'
import { useAragonApi } from '../api-react'
import { GraphQLClient } from 'graphql-request'
import { issueAttributes } from '../utils/gql-queries.js'
import useShapedIssue from '../hooks/useShapedIssue'

const getIssues = ids => `{
  nodes(ids: [${ids.map(id => `"${id}"`)}]) {
    ... on Issue { ${issueAttributes} }
  }
}`

const BountyIssuesContext = React.createContext()

export function useBountyIssues() {
  const context = React.useContext(BountyIssuesContext)
  if (!context) {
    throw new Error('useBountyIssues must be used within a BountyIssuesProvider')
  }
  return context
}

export function BountyIssuesProvider(props) {
  const { appState: { github, issues } } = useAragonApi()
  const [ bountyIssues, setBountyIssues ] = React.useState([])
  const shapeIssue = useShapedIssue()

  const issueIds = React.useMemo(() => {
    // old versions of the Projects app did not store issueId on ipfs
    // we filter out such issues; they are not supported by this function
    return issues
      .filter(i => !i.data.repository || (i.data.repository && !i.data.repository.decoupled))
      .map(i => {
        return i.data.issueId
      }).filter(i => {
        return i
      })
  }, [issues])

  const decoupledBounties = React.useMemo(() => {
    // bounties from decoupled repos must bypass GQL
    return issues.filter(i => i.data.repository && i.data.repository.decoupled && i.data.hasBounty).map(i => i.data)
  }, [issues])

  React.useEffect(() => {
    if (!github.token) return

    const client = new GraphQLClient('https://api.github.com/graphql', {
      headers: {
        Authorization: 'Bearer ' + github.token,
      },
    })
    client.request(getIssues(issueIds))
      .then(({ nodes }) => {
        const now = new Date()
        setBountyIssues([ ...nodes, ...decoupledBounties ].map(shapeIssue).sort((a, b) => {
          //If a deadline has expired, most recent deadline first
          //If a deadline upcoming, closest to the deadline first
          let aDate = new Date(a.deadline)
          let bDate = new Date(b.deadline)
          if (aDate < now || bDate < now) {
            aDate = now - aDate
            bDate = now - bDate
          }
          return aDate - bDate
        }))
      })
      .catch(console.error)
  }, [ github.token, issueIds ])

  return <BountyIssuesContext.Provider value={bountyIssues} {...props} />
}
