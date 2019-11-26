import PropTypes from 'prop-types'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { useQuery } from '@apollo/react-hooks'

import { useAragonApi } from '../../api-react'
import { Button, GU, Text } from '@aragon/ui'
import { compareAsc, compareDesc } from 'date-fns'

import { initApolloClient } from '../../utils/apollo-client'
import useShapedIssue from '../../hooks/useShapedIssue'
import { getIssuesGQL } from '../../utils/gql-queries.js'
import { FilterBar } from '../Shared'
import { Issue } from '../Card'
import { LoadingAnimation } from '../Shared'
import { EmptyWrapper } from '../Shared'
import { useIssueFilters } from '../../context/IssueFilters'
import { applyFilters } from './applyFilters'

const sorters = {
  'Name ascending': (i1, i2) =>
    i1.title.toUpperCase() > i2.title.toUpperCase() ? 1 : -1,
  'Name descending': (i1, i2) =>
    i1.title.toUpperCase() > i2.title.toUpperCase() ? -1 : 1,
  'Newest': (i1, i2) =>
    compareDesc(new Date(i1.createdAt), new Date(i2.createdAt)),
  'Oldest': (i1, i2) =>
    compareAsc(new Date(i1.createdAt), new Date(i2.createdAt)),
}

const ISSUES_PER_CALL = 100

const QueryLoading = () => (
  <StyledIssues>
    <FilterBar />
    <EmptyWrapper>
      <Text size="large" css={`margin-bottom: ${3 * GU}px`}>
        Loading...
      </Text>
      <LoadingAnimation />
    </EmptyWrapper>
  </StyledIssues>
)

const QueryError = ({ error, refetch }) => (
  <StyledIssues>
    <FilterBar />
    <IssuesScrollView>
      <div>
        Error {JSON.stringify(error)}
        <div>
          <Button mode="strong" onClick={() => refetch()}>
            Try refetching?
          </Button>
        </div>
      </div>
    </IssuesScrollView>
  </StyledIssues>
)
QueryError.propTypes = {
  error: PropTypes.string.isRequired,
  refetch: PropTypes.func.isRequired,
}

const Issues = ({ graphqlQuery, setSelectedIssue, setDownloadedRepos }) => {
  const [ selectedIssues, setSelectedIssues ] = useState({})
  const [ alreadyDownloadedIssues, setAlreadyDownloadedIssues ] = useState([])
  const [ allSelected, setAllSelected ] = useState(false)
  const shapeIssue = useShapedIssue()
  const { buildAvailableFilters, sortBy } = useIssueFilters()
  const deselectAllIssues = () => {
    setSelectedIssues({})
    setAllSelected(false)
  }
  const { appState: { issues: bountyIssues } } = useAragonApi()

  const toggleSelectAll = useCallback(issuesFiltered => () => {
    const selectedIssues = {}
    setAllSelected(!allSelected)
    if (!allSelected) {
      issuesFiltered.map(shapeIssue).forEach(
        issue => (selectedIssues[issue.id] = issue)
      )
    }
    setSelectedIssues(selectedIssues)
  }, [ allSelected, selectedIssues, shapeIssue ])

  const handleIssueSelection = useCallback(issue => {
    const newSelectedIssues = { ...selectedIssues }
    if (issue.id in newSelectedIssues) {
      delete newSelectedIssues[issue.id]
    } else {
      newSelectedIssues[issue.id] = issue
    }
    setSelectedIssues(newSelectedIssues)
  }, [selectedIssues])

  const { loading, error, data, refetch } = graphqlQuery

  const { issues, downloadedRepos } = useMemo(() => flattenIssues(data, alreadyDownloadedIssues), [ data, alreadyDownloadedIssues ])

  const issuesFiltered = applyFilters({ issues, bountyIssues })

  useEffect(() => {
    if (issues.length) buildAvailableFilters(issues, bountyIssues)
  }, [ issues, bountyIssues ])

  if (loading) return <QueryLoading />

  if (error) return <QueryError error={error} refetch={refetch} />

  const moreIssuesToShow = Object.keys(downloadedRepos).filter(
    repoId => downloadedRepos[repoId].hasNextPage
  ).length > 0

  const showMoreIssues = (issues, downloadedRepos) => {
    let newDownloadedRepos = { ...downloadedRepos }

    Object.keys(downloadedRepos).forEach(repoId => {
      newDownloadedRepos[repoId].showMore = downloadedRepos[repoId].hasNextPage
    })
    setDownloadedRepos(newDownloadedRepos)
    setAlreadyDownloadedIssues(issues)
  }

  return (
    <StyledIssues>
      <FilterBar
        handleSelectAll={toggleSelectAll(issuesFiltered)}
        allSelected={allSelected}
        issues={issues}
        issuesFiltered={issuesFiltered}
        bountyIssues={bountyIssues}
        deselectAllIssues={deselectAllIssues}
        selectedIssues={Object.keys(selectedIssues).map(
          id => selectedIssues[id]
        )}
      />
      <IssuesScrollView>
        <ScrollWrapper>
          {issuesFiltered.map(shapeIssue)
            .sort(sorters[sortBy])
            .map(issue => (
              <Issue
                isSelected={issue.id in selectedIssues}
                key={issue.number}
                {...issue}
                onClick={setSelectedIssue}
                onSelect={handleIssueSelection}
              />
            ))}
        </ScrollWrapper>
        <div css="text-align: center;">
          {moreIssuesToShow && (
            <Button
              style={{ margin: '12px 0 30px 0' }}
              mode="secondary"
              onClick={() =>
                showMoreIssues(issues, downloadedRepos)
              }
            >
              Show More
            </Button>
          )}
        </div>
      </IssuesScrollView>
    </StyledIssues>
  )
}

Issues.propTypes = {
  graphqlQuery: PropTypes.object.isRequired,
  setSelectedIssue: PropTypes.func.isRequired,
  setDownloadedRepos: PropTypes.func.isRequired,
}

/*
Data obtained from github API is data.{repo}.issues.[nodes] and it needs
flattening into one simple array of issues  before it can be used

Returns array of issues and object of repos numbers: how many issues
in repo in total, how many downloaded, how many to fetch next time
(for "show more")
*/

const flattenIssues = (data, alreadyDownloadedIssues) => {
  let downloadedIssues = []
  const downloadedRepos = {}

  if (!data) return { issues: downloadedIssues, downloadedRepos }

  Object.keys(data).forEach(nodeName => {
    const repo = data[nodeName]
    downloadedRepos[repo.id] = {
      downloadedCount: repo.issues.nodes.length,
      totalCount: repo.issues.totalCount,
      fetch: ISSUES_PER_CALL,
      hasNextPage: repo.issues.pageInfo.hasNextPage,
      endCursor: repo.issues.pageInfo.endCursor,
    }
    downloadedIssues = downloadedIssues.concat(...repo.issues.nodes)
  })

  if (alreadyDownloadedIssues.length > 0) {
    const keys = downloadedIssues.map(issue => issue.id)

    downloadedIssues = downloadedIssues.concat(
      alreadyDownloadedIssues.filter(issue => (!keys.includes(issue.id)))
    )
  }

  return { issues: downloadedIssues, downloadedRepos }
}

const IssuesQuery = ({ client, query, setDownloadedRepos, ...props }) => {
  const graphqlQuery = useQuery(query, { client, onError: console.error })

  return (
    <Issues
      graphqlQuery={graphqlQuery}
      setDownloadedRepos={setDownloadedRepos}
      {...props}
    />
  )
}

IssuesQuery.propTypes = {
  client: PropTypes.object.isRequired,
  query: PropTypes.object.isRequired,
  setDownloadedRepos: PropTypes.func.isRequired,
}

const IssuesWrap = props => {
  const { appState: { github, repos } } = useAragonApi()
  const [ client, setClient ] = useState(null)
  const [ downloadedRepos, setDownloadedRepos ] = useState({})
  const [ query, setQuery ] = useState(null)

  const { activeFilters } = useIssueFilters()

  // build params for GQL query, each repo to fetch has number of items to download,
  // and a cursor if there are 100+ issues and "Show More" was clicked.

  useEffect(() => {
    let reposQueryParams = {}

    if (Object.keys(downloadedRepos).length > 0) {
      Object.keys(downloadedRepos).forEach(repoId => {
        if (downloadedRepos[repoId].hasNextPage)
          reposQueryParams[repoId] = downloadedRepos[repoId]
      })
    } else {
      if (Object.keys(activeFilters.projects).length > 0) {
        Object.keys(activeFilters.projects).forEach(repoId => {
          reposQueryParams[repoId] = {
            fetch: ISSUES_PER_CALL,
            showMore: false,
          }
        })
      } else {
        repos.forEach(repo => {
          const repoId = repo.data._repo
          reposQueryParams[repoId] = {
            fetch: ISSUES_PER_CALL,
            showMore: false,
          }
        })
      }
    }

    setQuery(getIssuesGQL(reposQueryParams))
  }, [ downloadedRepos, activeFilters, repos ])

  useEffect(() => {
    setClient(github.token ? initApolloClient(github.token) : null)
  }, [github.token])

  if (!query) return 'Loading...'

  if (!client) return 'You must sign into GitHub to view issues.'

  return (
    <IssuesQuery
      client={client}
      query={query}
      setDownloadedRepos={setDownloadedRepos}
      {...props}
    />
  )
}

const StyledIssues = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`

const ScrollWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  flex-grow: 1;
  > :first-child {
    border-radius: 3px 3px 0 0;
  }
  > :last-child {
    border-radius: 0 0 3px 3px;
    margin-bottom: 10px;
  }
`

// TODO: Calculate height with flex (maybe to add pagination at bottom?)
const IssuesScrollView = styled.div`
  height: 75vh;
  position: relative;
`

// eslint-disable-next-line import/no-unused-modules
export default IssuesWrap
