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

  React.useEffect(() => {
    if (!github.token) return

    const client = new GraphQLClient('https://api.github.com/graphql', {
      headers: {
        Authorization: 'Bearer ' + github.token,
      },
    })

    client.request(getIssues(issues.map(i => i.data.issueId)))
      .then(({ nodes }) => {
        const now = new Date()
        setBountyIssues(nodes.map(shapeIssue).sort((a, b) => {
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
  }, [ github.token, issues ])

  return <BountyIssuesContext.Provider value={bountyIssues} {...props} />
}
