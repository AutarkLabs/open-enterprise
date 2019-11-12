import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useQuery } from '@apollo/react-hooks'

import { useAragonApi } from '@aragon/api-react'
import { Button, GU, Text } from '@aragon/ui'
import { compareAsc, compareDesc } from 'date-fns'

import { initApolloClient } from '../../utils/apollo-client'
import useShapedIssue from '../../hooks/useShapedIssue'
import { STATUS } from '../../utils/github'
import { getIssuesGQL } from '../../utils/gql-queries.js'
import { FilterBar } from '../Shared'
import { Issue } from '../Card'
import { LoadingAnimation } from '../Shared'
import { EmptyWrapper } from '../Shared'
import { useIssuesFilters } from '../../context/IssuesFilters.js'
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





const Issues = ({ activeIndex, bountyIssues, bountySettings, github, graphqlQuery, setDownloadedRepos, setFilters, setSelectedIssue, shapeIssue, status, tokens }) => {
  const [ selectedIssues, setSelectedIssues ] = useState({})
  const [ allSelected, setAllSelected ] = useState(false)
  const [ sortBy, setSortBy ] = useState('Newest')
  const [ textFilter, setTextFilter ] = useState('')
  const [ alreadyDownloadedIssues, setAlreadyDownloadedIssues ] = useState([])

  const { activeFilters } = useIssuesFilters()
console.log('--one, two...', activeFilters)

  const deselectAllIssues = () => {
    setSelectedIssues({})
    setAllSelected(false)
  }

  const toggleSelectAll = issuesFiltered => () => {
    const selectedIssues = {}
    setAllSelected(!allSelected)
    if (!allSelected) {
      issuesFiltered.map(shapeIssue).forEach(
        issue => (selectedIssues[issue.id] = issue)
      )
    }
    setSelectedIssues(selectedIssues)
  }

  const handleSorting = sortBy => setSortBy(sortBy)

  const handleIssueSelection = issue => {
    const newSelectedIssues = { ...selectedIssues }
    if (issue.id in newSelectedIssues) {
      delete newSelectedIssues[issue.id]
    } else {
      newSelectedIssues[issue.id] = issue
    }
    setSelectedIssues(newSelectedIssues)
  }

  const handleTextFilter = e => setTextFilter(e.target.value.toUpperCase())

  const disableAllFilters = () => {
    setFilters({
      projects: {},
      labels: {},
      milestones: {},
      deadlines: {},
      experiences: {},
      statuses: {},
    })
  }

  const filterBar = (issues, issuesFiltered) => {
    return (
      <FilterBar
        sortBy={sortBy}
        handleSelectAll={toggleSelectAll(issuesFiltered)}
        allSelected={allSelected}
        issues={issues}
        issuesFiltered={issuesFiltered}
        handleSorting={handleSorting}
        activeIndex={activeIndex}
        bountyIssues={bountyIssues}
        disableAllFilters={disableAllFilters}
        deselectAllIssues={deselectAllIssues}
        onSearchChange={handleTextFilter}
        selectedIssues={Object.keys(selectedIssues).map(
          id => selectedIssues[id]
        )}
      />
    )
  }

  const queryLoading = () => (
    <StyledIssues>
      {filterBar([], [])}
      <EmptyWrapper>
        <Text size="large" css={`margin-bottom: ${3 * GU}px`}>
          Loading...
        </Text>
        <LoadingAnimation />
      </EmptyWrapper>
    </StyledIssues>
  )

  const queryError = (error, refetch) => (
    <StyledIssues>
      {filterBar([], [])}
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

  /*
   Data obtained from github API is data.{repo}.issues.[nodes] and it needs
   flattening into one simple array of issues  before it can be used

   Returns array of issues and object of repos numbers: how many issues
   in repo in total, how many downloaded, how many to fetch next time
   (for "show more")
  */
  const flattenIssues = data => {
    let downloadedIssues = []
    const downloadedRepos = {}

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
      downloadedIssues = downloadedIssues.concat(alreadyDownloadedIssues)
    }

    return { downloadedIssues, downloadedRepos }
  }

  const showMoreIssues = (newDownloadedIssues, downloadedRepos) => {
    let newDownloadedRepos = { ...downloadedRepos }

    Object.keys(downloadedRepos).forEach(repoId => {
      newDownloadedRepos[repoId].showMore = downloadedRepos[repoId].hasNextPage
    })
    setDownloadedRepos(newDownloadedRepos)
    setAlreadyDownloadedIssues(newDownloadedIssues)
  }

  const { data, loading, error, refetch } = graphqlQuery

  if (loading) return queryLoading()

  if (error) return queryError(error, refetch)

  // first, flatten data structure into array of issues
  const { downloadedIssues, downloadedRepos } = flattenIssues(data)

  // then apply filtering
  const issuesFiltered = applyFilters(downloadedIssues, textFilter, activeFilters, bountyIssues)

  // then determine whether any shown repos have more issues to fetch
  const moreIssuesToShow =
    Object.keys(downloadedRepos).filter(
      repoId => downloadedRepos[repoId].hasNextPage
    ).length > 0

  return (
    <StyledIssues>
      <FilterBar
        sortBy={sortBy}
        handleSelectAll={toggleSelectAll(issuesFiltered)}
        allSelected={allSelected}
        issues={downloadedIssues}
        issuesFiltered={issuesFiltered}
        handleSorting={handleSorting}
        activeIndex={activeIndex}
        bountyIssues={bountyIssues}
        disableAllFilters={disableAllFilters}
        deselectAllIssues={deselectAllIssues}
        onSearchChange={handleTextFilter}
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
                showMoreIssues(downloadedIssues, downloadedRepos)
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
  activeIndex: PropTypes.shape({
    tabData: PropTypes.object.isRequired,
  }).isRequired,
  bountyIssues: PropTypes.array.isRequired,
  bountySettings: PropTypes.shape({
    expLvls: PropTypes.array.isRequired,
  }).isRequired,
  filters: PropTypes.object.isRequired,
  github: PropTypes.shape({
    status: PropTypes.oneOf([
      STATUS.AUTHENTICATED,
      STATUS.FAILED,
      STATUS.INITIAL,
    ]).isRequired,
    token: PropTypes.string,
    event: PropTypes.string,
  }),
  graphqlQuery: PropTypes.shape({
    data: PropTypes.object,
    error: PropTypes.string,
    loading: PropTypes.bool.isRequired,
    refetch: PropTypes.func,
  }).isRequired,
  setDownloadedRepos: PropTypes.func.isRequired,
  setFilters: PropTypes.func.isRequired,
  setSelectedIssue: PropTypes.func.isRequired,
  shapeIssue: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  tokens: PropTypes.array.isRequired,
}






const IssuesQuery = ({ client, query, ...props }) => {
  const graphqlQuery = useQuery(query, { client, onError: console.error })
  return <Issues graphqlQuery={graphqlQuery} {...props} />
}

IssuesQuery.propTypes = {
  client: PropTypes.object.isRequired,
  query: PropTypes.object.isRequired,
}

const IssuesWrap = ({ activeIndex, ...props }) => {
  const { appState: { github, repos } } = useAragonApi()
  const shapeIssue = useShapedIssue()
  const [ client, setClient ] = useState(null)
  const [ downloadedRepos, setDownloadedRepos ] = useState({})
  const [ query, setQuery ] = useState(null)
  const [ filters, setFilters ] = useState({
    projects: activeIndex.tabData.filterIssuesByRepoId
      ? { [activeIndex.tabData.filterIssuesByRepoId]: true }
      : {},
    labels: {},
    milestones: {},
    deadlines: {},
    experiences: {},
    statuses: {},
  })

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
      if (Object.keys(filters.projects).length > 0) {
        Object.keys(filters.projects).forEach(repoId => {
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
  }, [ downloadedRepos, filters, repos ])

  useEffect(() => {
    setClient(github.token ? initApolloClient(github.token) : null)
  }, [github.token])

  if (!query) return 'Loading...'

  if (!client) return 'You must sign into GitHub to view issues.'

  return (
    <IssuesQuery
      activeIndex={activeIndex}
      client={client}
      filters={filters}
      query={query}
      shapeIssue={shapeIssue}
      setDownloadedRepos={setDownloadedRepos}
      setFilters={setFilters}
      {...props}
    />
  )
}

IssuesWrap.propTypes = {
  activeIndex: PropTypes.shape({
    tabData: PropTypes.shape({
      filterIssuesByRepoId: PropTypes.string,
    }).isRequired,
  }).isRequired,
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

const recursiveDeletePathFromObject = (path, object) => {
  if (path.length === 1) {
    delete object[path[0]]
  } else {
    const key = path.shift()
    const newObject = object[key]
    recursiveDeletePathFromObject(path, newObject)
  }
}

// eslint-disable-next-line import/no-unused-modules
export default IssuesWrap
