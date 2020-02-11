import PropTypes from 'prop-types'
import React, { useEffect, useState, useCallback } from 'react'
import styled from 'styled-components'
import { useQuery } from '@apollo/react-hooks'

import { useAragonApi } from '../../api-react'
import { Button, GU, Header, IconPlus, Text } from '@aragon/ui'
import { initApolloClient } from '../../utils/apollo-client'
import useShapedIssue from '../../hooks/useShapedIssue'
import { STATUS } from '../../utils/github'
import { SEARCH_ISSUES } from '../../utils/gql-queries.js'
import { Issue } from '../Card'
import { EmptyWrapper, FilterBar, LoadingAnimation } from '../Shared'
import { usePanelManagement } from '../Panel'
import usePathHelpers from '../../../../../shared/utils/usePathHelpers'
import { useIssueFilters } from '../../context/IssueFilters'
import { applyFilters } from './applyFilters'

const QueryLoading = () => (
  <StyledIssues>
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

const ProjectDetail = ({ graphqlQuery, viewIssue }) =>  {
  const shapeIssue = useShapedIssue()
  const { selectedIssues, setSelectedIssues } = useIssueFilters()

  const { appState: { issues: bountyIssues } } = useAragonApi()

  const handleIssueSelection = useCallback(issue => {
    const newSelectedIssues = { ...selectedIssues }
    if (issue.id in newSelectedIssues) {
      delete newSelectedIssues[issue.id]
    } else {
      newSelectedIssues[issue.id] = issue
    }
    setSelectedIssues(newSelectedIssues)
  }, [selectedIssues])

  const { data, loading, error, refetch, fetchMore } = graphqlQuery

  const issues = data ? data.search.issues.map(shapeIssue) : []

  const filteredIssues = applyFilters(issues, bountyIssues)

  if (loading) return <QueryLoading />
  if (error) return <QueryError error={error} refetch={refetch} />

  return (
    <StyledIssues>
      <IssuesScrollView>
        <ScrollWrapper>
          {filteredIssues.map(issue => (
            <Issue
              isSelected={issue.id in selectedIssues}
              key={issue.id}
              {...issue}
              onClick={viewIssue}
              onSelect={handleIssueSelection}
            />
          ))}
        </ScrollWrapper>

        <div style={{ textAlign: 'center' }}>
          {loading ? (
            <div css={`
                align-items: center;
                display: flex;
                flex-direction: column;
                margin: 25px;
              `}>
              <Text size="large" css={`margin-bottom: ${3 * GU}px`}>
                  Loading...
              </Text>
              <LoadingAnimation />
            </div>
          ) : data && data.search.pageInfo.hasNextPage && (
            <Button
              style={{ margin: '12px 0 30px 0' }}
              mode="secondary"
              onClick={() => {
                fetchMore({
                  variables: { after: data.search.pageInfo.endCursor },
                  updateQuery: (prev, { fetchMoreResult }) => {

                    if (!fetchMoreResult) return prev

                    return {
                      ...fetchMoreResult,
                      search: {
                        ...fetchMoreResult.search,
                        issues: [
                          ...prev.search.issues,
                          ...fetchMoreResult.search.issues,
                        ],
                      }
                    }
                  },
                })
              }}
            >
              Show More
            </Button>
          )}
        </div>
      </IssuesScrollView>
    </StyledIssues>
  )
}

ProjectDetail.propTypes = {
  graphqlQuery: PropTypes.shape({
    data: PropTypes.object,
    error: PropTypes.string,
    loading: PropTypes.bool.isRequired,
    refetch: PropTypes.func,
    fetchMore: PropTypes.func,
  }).isRequired,
  viewIssue: PropTypes.func.isRequired,
}

const ProjectDetailWrap = ({ repo }) => {
  const { appState } = useAragonApi()
  const {
    github = { status : STATUS.INITIAL },
  } = appState
  const { setupNewIssue } = usePanelManagement()
  const [ client, setClient ] = useState(null)
  const { buildAvailableFilters, activeFilters, availableFilters, textFilter, sortBy } = useIssueFilters()
  const { requestPath } = usePathHelpers()
  const viewIssue = useCallback(id => {
    requestPath('/issues/' + id)
  })

  const q = 'is:issue state:open ' +
  `repo:${repo.metadata.owner}/${repo.metadata.name} ` +
  `sort:${sortBy} ` +
  (textFilter ? textFilter + ' in:title' : '' ) +
  Object.keys(activeFilters.labels).map(id => 'label:' + availableFilters.labels[id].name).join(' ')

  const graphqlQuery = useQuery(SEARCH_ISSUES, {
    notifyOnNetworkStatusChange: true,
    onError: console.error,
    variables: {
      query: q,
    },
  })

  useEffect(() => {
    setClient(github.token ? initApolloClient(github.token) : null)
  }, [github.token])

  useEffect(() => {
    buildAvailableFilters(repo)
  }, [repo])

  return (
    <>
      <Header
        primary={repo && repo.metadata.name || 'Projects'}
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={setupNewIssue} label="New issue" />
        }
      />
      {!client ? (
        'You must sign into GitHub to view issues.'
      ) : (
        <>
          <FilterBar />
          <ProjectDetail graphqlQuery={graphqlQuery} viewIssue={viewIssue} />
        </>
      )}
    </>
  )
}

ProjectDetailWrap.propTypes = {
  repo: PropTypes.object.isRequired,
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
export default ProjectDetailWrap
