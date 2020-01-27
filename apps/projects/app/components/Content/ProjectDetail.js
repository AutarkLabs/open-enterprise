import PropTypes from 'prop-types'
import React, { useState, useCallback } from 'react'
import styled from 'styled-components'
import { useQuery } from '@apollo/react-hooks'

import { Button, GU, Header, IconPlus, Text } from '@aragon/ui'
import { compareAsc, compareDesc } from 'date-fns'

import useShapedIssue from '../../hooks/useShapedIssue'
import { useBountyIssues } from '../../context/BountyIssues'
import { SEARCH_ISSUES } from '../../utils/gql-queries.js'
import { Issue } from '../Card'
import { FilterBar, LoadingAnimation } from '../Shared'
import { usePanelManagement } from '../Panel'
import usePathHelpers from '../../../../../shared/utils/usePathHelpers'

const sortOptions = {
  'updated-desc': {
    name: 'Recently updated',
    func: (a, b) => compareDesc(new Date(a.updatedAt), new Date(b.updatedAt))
  },
  'updated-asc': {
    name: 'Least recently updated',
    func: (a, b) => compareAsc(new Date(a.updatedAt), new Date(b.updatedAt))
  },
}

class ProjectDetail extends React.PureComponent {
  static propTypes = {
    bountyIssues: PropTypes.array.isRequired,
    filters: PropTypes.object.isRequired,
    graphqlQuery: PropTypes.shape({
      data: PropTypes.object,
      error: PropTypes.string,
      loading: PropTypes.bool.isRequired,
      refetch: PropTypes.func,
      fetchMore: PropTypes.func,
    }).isRequired,
    viewIssue: PropTypes.func.isRequired,
    setFilters: PropTypes.func.isRequired,
    setQuery: PropTypes.func.isRequired,
    setSortBy: PropTypes.func.isRequired,
    shapeIssue: PropTypes.func.isRequired,
    sortBy: PropTypes.string.isRequired,
  }

  state = {
    selectedIssues: {},
    textFilter: '',
    reload: false,
  }

  deselectAllIssues = () => {
    this.setState({ selectedIssues: {} })
  }

  handleFiltering = filters => {
    this.props.setFilters(filters)
    // TODO: why is reload necessary?
    this.setState(prevState => ({
      reload: !prevState.reload,
    }))
  }

  applyFilters = allIssues => {
    const { textFilter } = this.state
    const { filters, bountyIssues } = this.props

    // only filter locally if filtering by bounty status
    if (Object.keys(filters.statuses).length === 0) {
      return allIssues
    }

    // no issue can be "not funded" and have some other funding state
    if (filters.statuses['not-funded'] && Object.keys(filters.statuses).length > 1) {
      return []
    }

    const bountyIssueObj = {}
    bountyIssues.forEach(issue => {
      bountyIssueObj[issue.issueId] = issue.data.workStatus
    })

    // if not funded, filter allIssues for those that have no bounty
    // other filtering happens via GitHub query
    if (filters.statuses['not-funded']) {
      return allIssues.filter(i => !bountyIssueObj[i.issueId])
    }

    // otherwise, we want some subset of bountyIssues
    // now we need to filter locally
    let issuesByStatus

    // if only 'all-funded' checked, we want all bountyIssues
    if (filters.statuses['all-funded'] && Object.keys(filters.statuses).length === 1) {
      issuesByStatus = bountyIssues
    }
    // otherwise, check if issue's status is in selected filters
    else {
      issuesByStatus = bountyIssues.filter(issue =>
        bountyIssueObj[issue.issueId] in filters.statuses
      )
    }

    const issuesByLabel = issuesByStatus.filter(issue => {
      // if there are no labels to filter by, pass all
      if (Object.keys(filters.labels).length === 0) return true
      // if labelless issues are allowed, let them pass
      if ('labelless' in filters.labels && issue.labels.totalCount === 0)
        return true
      // otherwise, fail all issues without labels
      if (issue.labels.totalCount === 0) return false

      const labelsIds = issue.labels.edges.map(label => label.node.id)

      if (
        Object.keys(filters.labels).filter(id => labelsIds.indexOf(id) !== -1)
          .length > 0
      )
        return true
      return false
    })

    const issuesByMilestone = issuesByLabel.filter(issue => {
      // if there are no MS filters, all issues pass
      if (Object.keys(filters.milestones).length === 0) return true
      // should issues without milestones pass?
      if ('milestoneless' in filters.milestones && issue.milestone === null)
        return true
      // if issues without milestones should not pass, they are rejected below
      if (issue.milestone === null) return false
      if (Object.keys(filters.milestones).indexOf(issue.milestone.id) !== -1)
        return true
      return false
    })

    let issuesFiltered

    if (!textFilter) {
      issuesFiltered = issuesByMilestone
    } else {
      issuesFiltered = issuesByMilestone.filter(
        issue =>
          issue.title.toUpperCase().indexOf(textFilter) !== -1 ||
          String(issue.number).indexOf(textFilter) !== -1
      )
    }

    return issuesFiltered.sort(sortOptions[this.props.sortBy].func)
  }

  handleIssueSelection = issue => {
    this.setState(prevState => {
      const newSelectedIssues = prevState.selectedIssues
      if (issue.id in newSelectedIssues) {
        delete newSelectedIssues[issue.id]
      } else {
        newSelectedIssues[issue.id] = issue
      }
      return { selectedIssues: newSelectedIssues, reload: !prevState.reload }
    })
  }

  handleTextFilter = e => {
    this.setState({
      textFilter: e.target.value.toUpperCase(),
      reload: !this.state.reload,
    })
  }

  disableFilter = pathToFilter => {
    let newFilters = { ...this.props.filters }
    recursiveDeletePathFromObject(pathToFilter, newFilters)
    this.props.setFilters(newFilters)
  }

  disableAllFilters = () => {
    this.props.setFilters({
      labels: {},
      milestones: {},
      statuses: {},
    })
  }

  filterBar = (allIssues, filteredIssues) => {
    return (
      <FilterBar
        setParentFilters={this.props.setFilters}
        filters={this.props.filters}
        issues={allIssues}
        issuesFiltered={filteredIssues}
        handleFiltering={this.handleFiltering}
        handleSorting={this.props.setSortBy}
        bountyIssues={this.props.bountyIssues}
        disableFilter={this.disableFilter}
        disableAllFilters={this.disableAllFilters}
        deselectAllIssues={this.deselectAllIssues}
        onSearchChange={this.handleTextFilter}
        selectedIssues={Object.keys(this.state.selectedIssues).map(
          id => this.state.selectedIssues[id]
        )}
        sortBy={this.props.sortBy}
        sortOptions={sortOptions}
      />
    )
  }

  queryError = (error, refetch) => (
    <StyledIssues>
      {this.filterBar([], [])}
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

  render() {
    const { data, loading, error, refetch, fetchMore } = this.props.graphqlQuery

    if (error) return this.queryError(error, refetch)

    const allIssues = data ? data.search.issues.map(this.props.shapeIssue) : []
    const filteredIssues = this.applyFilters(allIssues)

    return (
      <StyledIssues>
        {this.filterBar(allIssues, filteredIssues)}

        <IssuesScrollView>
          <ScrollWrapper>
            {filteredIssues.map(issue => (
              <Issue
                isSelected={issue.id in this.state.selectedIssues}
                key={issue.id}
                {...issue}
                onClick={this.props.viewIssue}
                onSelect={this.handleIssueSelection}
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
                        },
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
}

const ProjectDetailWrap = ({ repo, ...props }) => {
  const bountyIssues = useBountyIssues().filter(issue =>
    issue.repoId === repo.data._repo
  )
  const shapeIssue = useShapedIssue()
  const { setupNewIssue } = usePanelManagement()
  const [ query, setQueryRaw ] = useState({
    repo: `${repo.metadata.owner}/${repo.metadata.name}`,
    search: '',
    sort: 'updated-desc',
  })
  const setQuery = useCallback(params => {
    setQueryRaw({ ...query, ...params })
  }, [])
  const [ filters, setFilters ] = useState({
    labels: {},
    milestones: {},
    statuses: {},
  })
  const { requestPath } = usePathHelpers()
  const viewIssue = useCallback(id => {
    requestPath('/issues/' + id)
  })

  const graphqlQuery = useQuery(SEARCH_ISSUES, {
    notifyOnNetworkStatusChange: true,
    onError: console.error,
    variables: {
      after: query.after,
      query: 'is:issue state:open ' +
        `repo:${query.repo} ` +
        `sort:${query.sort} ` +
        `${query.search}`,
    },
  })

  const [ sortBy, setSortByRaw ] = useState(Object.keys(sortOptions)[0])

  const setSortBy = useCallback(sort => {
    setSortByRaw(sort)
    setQuery({ sort })
  }, [])

  return (
    <>
      <Header
        primary={repo && repo.metadata.name || 'Projects'}
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={setupNewIssue} label="New issue" />
        }
      />
      <ProjectDetail
        bountyIssues={bountyIssues}
        filters={filters}
        graphqlQuery={graphqlQuery}
        viewIssue={viewIssue}
        setFilters={setFilters}
        setQuery={setQuery}
        shapeIssue={shapeIssue}
        sortBy={sortBy}
        setSortBy={setSortBy}
        {...props}
      />
    </>
  )
}

ProjectDetailWrap.propTypes = {
  repo: PropTypes.shape({
    data: PropTypes.shape({
      _repo: PropTypes.string,
    }),
    metadata: PropTypes.shape({
      name: PropTypes.string,
      owner: PropTypes.string,
    })
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
export default ProjectDetailWrap
