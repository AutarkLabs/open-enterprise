import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Query } from 'react-apollo'
//import Query from './Query.stub'

import { Button, GU, Text } from '@aragon/ui'
import BigNumber from 'bignumber.js'
import { compareAsc, compareDesc } from 'date-fns'

import { STATUS } from '../../utils/github'
import { getIssuesGQL } from '../../utils/gql-queries.js'
import { FilterBar } from '../Shared'
import { Issue } from '../Card'
import IssueDetail from './IssueDetail'
import { LoadingAnimation } from '../Shared'
import { EmptyWrapper } from '../Shared'

class Issues extends React.PureComponent {
  static propTypes = {
    activeIndex: PropTypes.shape({
      tabData: PropTypes.object.isRequired,
    }).isRequired,
    bountyIssues: PropTypes.array.isRequired,
    bountySettings: PropTypes.shape({
      expLvls: PropTypes.array.isRequired,
    }).isRequired,
    github: PropTypes.shape({
      status: PropTypes.oneOf([
        STATUS.AUTHENTICATED,
        STATUS.FAILED,
        STATUS.INITIAL,
      ]).isRequired,
      token: PropTypes.string,
      event: PropTypes.string,
    }),
    issueDetail: PropTypes.bool.isRequired,
    projects: PropTypes.array.isRequired,
    setIssueDetail: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
    tokens: PropTypes.array.isRequired,
  }

  state = {
    selectedIssues: {},
    allSelected: false,
    filters: {
      projects: {},
      labels: {},
      milestones: {},
      deadlines: {},
      experiences: {},
      statuses: {},
    },
    sortBy: 'Newest',
    textFilter: '',
    reload: false,
    currentIssue: {},
    downloadedRepos: {},
    downloadedIssues: [],
    issuesPerCall: 100,
  }

  componentWillMount() {
    if ('filterIssuesByRepoId' in this.props.activeIndex.tabData) {
      const { filters } = this.state
      filters.projects[
        this.props.activeIndex.tabData.filterIssuesByRepoId
      ] = true
      this.setState({ filters })
    }
  }

  deselectAllIssues = () => {
    this.setState({ selectedIssues: {}, allSelected: false })
  }

  toggleSelectAll = issuesFiltered => () => {
    const selectedIssues = {}
    const allSelected = !this.state.allSelected
    const reload = !this.state.reload
    if (!this.state.allSelected) {
      this.shapeIssues(issuesFiltered).forEach(
        issue => (selectedIssues[issue.id] = issue)
      )
    }
    this.setState({ allSelected, selectedIssues, reload })
  }

  handleFiltering = filters => {
    // TODO: why is reload necessary?
    this.setState(prevState => ({
      filters: filters,
      reload: !prevState.reload,
    }))
  }

  handleSorting = sortBy => {
    // TODO: why is reload necessary?
    this.setState(prevState => ({ sortBy, reload: !prevState.reload }))
  }

  applyFilters = issues => {
    const { filters, textFilter } = this.state
    const { bountyIssues } = this.props

    const bountyIssueObj = {}
    bountyIssues.forEach(issue => {
      bountyIssueObj[issue.issueNumber] = issue.data.workStatus
    })

    const issuesByProject = issues.filter(issue => {
      if (Object.keys(filters.projects).length === 0) return true
      if (Object.keys(filters.projects).indexOf(issue.repository.id) !== -1)
        return true
      return false
    })

    const issuesByLabel = issuesByProject.filter(issue => {
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

    const issuesByStatus = issuesByMilestone.filter(issue => {
      // if there are no Status filters, all issues pass
      if (Object.keys(filters.statuses).length === 0) return true
      // should bountyless issues pass?
      const status = bountyIssueObj[issue.number]
        ? bountyIssueObj[issue.number]
        : 'not-funded'
      // if we look for all funded issues, regardless of stage...
      let filterPass =
        status in filters.statuses ||
        ('all-funded' in filters.statuses && status !== 'not-funded')
          ? true
          : false
      // ...or at specific stages
      return filterPass
    })

    // last but not least, if there is any text in textFilter...
    if (textFilter) {
      return issuesByStatus.filter(
        issue =>
          issue.title.toUpperCase().indexOf(textFilter) !== -1 ||
          String(issue.number).indexOf(textFilter) !== -1
      )
    }

    return issuesByStatus
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

  handleIssueClick = issue => {
    this.props.setIssueDetail(true)
    this.setState({ currentIssue: issue })
  }

  disableFilter = pathToFilter => {
    let newFilters = { ...this.state.filters }
    recursiveDeletePathFromObject(pathToFilter, newFilters)
    this.setState({ filters: newFilters })
  }

  disableAllFilters = () => {
    this.setState({
      filters: {
        projects: {},
        labels: {},
        milestones: {},
        deadlines: {},
        experiences: {},
        statuses: {},
      },
    })
  }

  setParentFilters = filters => {
    this.setState(filters)
  }

  filterBar = (issues, issuesFiltered) => {
    return (
      <FilterBar
        setParentFilters={this.setParentFilters}
        filters={this.state.filters}
        sortBy={this.state.sortBy}
        handleSelectAll={this.toggleSelectAll(issuesFiltered)}
        allSelected={this.state.allSelected}
        issues={issues}
        issuesFiltered={issuesFiltered}
        handleFiltering={this.handleFiltering}
        handleSorting={this.handleSorting}
        activeIndex={this.props.activeIndex}
        bountyIssues={this.props.bountyIssues}
        disableFilter={this.disableFilter}
        disableAllFilters={this.disableAllFilters}
        deselectAllIssues={this.deselectAllIssues}
        onSearchChange={this.handleTextFilter}
        selectedIssues={Object.keys(this.state.selectedIssues).map(
          id => this.state.selectedIssues[id]
        )}
      />
    )
  }

  queryLoading = () => (
    <StyledIssues>
      {this.filterBar([], [])}
      <EmptyWrapper>
        <Text size="large" css={`margin-bottom: ${3 * GU}px`}>
          Loading...
        </Text>
        <LoadingAnimation />
      </EmptyWrapper>
    </StyledIssues>
  )

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

  shapeIssues = issues => {
    const { tokens, bountyIssues, bountySettings } = this.props
    const bountyIssueObj = {}
    const tokenObj = {}
    const expLevels = bountySettings.expLvls

    bountyIssues.forEach(issue => {
      bountyIssueObj[issue.issueNumber] = issue
    })

    tokens.forEach(token => {
      tokenObj[token.addr] = {
        symbol: token.symbol,
        decimals: token.decimals,
      }
    })
    return issues.map(({ repository: { id, name }, ...fields }) => {
      const bountyId = bountyIssueObj[fields.number]
      const repoIdFromBounty = bountyId && bountyId.data.repoId
      if (bountyId && repoIdFromBounty === id) {
        const data = bountyIssueObj[fields.number].data
        const balance = BigNumber(bountyIssueObj[fields.number].data.balance)
          .div(BigNumber(10 ** tokenObj[data.token].decimals))
          .dp(3)
          .toString()

        return {
          ...fields,
          ...bountyIssueObj[fields.number].data,
          repoId: id,
          repo: name,
          symbol: tokenObj[data.token].symbol,
          expLevel: expLevels[data.exp].name,
          balance: balance,
        }
      }
      return {
        ...fields,
        repoId: id,
        repo: name,
      }
    })
  }

  generateSorter = () => {
    switch (this.state.sortBy) {
    case 'Name ascending':
      return (i1, i2) => {
        return i1.title.toUpperCase() > i2.title.toUpperCase() ? 1 : -1
      }
    case 'Name descending':
      return (i1, i2) => {
        return i1.title.toUpperCase() > i2.title.toUpperCase() ? -1 : 1
      }
    case 'Newest':
      return (i1, i2) => compareAsc(new Date(i1.createdAt), new Date(i2.createdAt))
    case 'Oldest':
      return (i1, i2) => compareDesc(new Date(i1.createdAt), new Date(i2.createdAt))
    }
  }

  renderCurrentIssue = currentIssue => {
    currentIssue.repository = {
      name: currentIssue.repo,
      id: currentIssue.repoId,
      __typename: 'Repository',
    }

    const currentIssueShaped = this.shapeIssues([currentIssue])[0]

    return <IssueDetail issue={currentIssueShaped} />
  }

  /*
   Data obtained from github API is data.{repo}.issues.[nodes] and it needs
   flattening into one simple array of issues  before it can be used

   Returns array of issues and object of repos numbers: how many issues
   in repo in total, how many downloaded, how many to fetch next time
   (for "show more")
  */
  flattenIssues = data => {
    let downloadedIssues = []
    const downloadedRepos = {}

    Object.keys(data).forEach(nodeName => {
      const repo = data[nodeName]

      downloadedRepos[repo.id] = {
        downloadedCount: repo.issues.nodes.length,
        totalCount: repo.issues.totalCount,
        fetch: this.state.issuesPerCall,
        hasNextPage: repo.issues.pageInfo.hasNextPage,
        endCursor: repo.issues.pageInfo.endCursor,
      }
      downloadedIssues = downloadedIssues.concat(...repo.issues.nodes)
    })

    if (this.state.downloadedIssues.length > 0) {
      downloadedIssues = downloadedIssues.concat(this.state.downloadedIssues)
    }

    return { downloadedIssues, downloadedRepos }
  }

  showMoreIssues = (downloadedIssues, downloadedRepos) => {
    let newDownloadedRepos = { ...downloadedRepos }

    Object.keys(downloadedRepos).forEach(repoId => {
      newDownloadedRepos[repoId].showMore = downloadedRepos[repoId].hasNextPage
    })
    this.setState({
      downloadedRepos: newDownloadedRepos,
      downloadedIssues,
    })
  }

  render() {
    const { projects, issueDetail } = this.props

    const { currentIssue, filters } = this.state

    // same if we only need to show Issue's Details screen
    if (issueDetail) return this.renderCurrentIssue(currentIssue, this.props)

    const currentSorter = this.generateSorter()

    // build params for GQL query, each repo to fetch has number of items to download,
    // and a cursor in there are 100+ issues and "Show More" was clicked.
    let reposQueryParams = {}

    if (Object.keys(this.state.downloadedRepos).length > 0) {
      Object.keys(this.state.downloadedRepos).forEach(repoId => {
        if (this.state.downloadedRepos[repoId].hasNextPage)
          reposQueryParams[repoId] = this.state.downloadedRepos[repoId]
      })
    } else {
      if (Object.keys(filters.projects).length > 0) {
        Object.keys(filters.projects).forEach(repoId => {
          reposQueryParams[repoId] = {
            fetch: this.state.issuesPerCall,
            showMore: false,
          }
        })
      } else {
        projects.forEach(project => {
          const repoId = project.data._repo
          reposQueryParams[repoId] = {
            fetch: this.state.issuesPerCall,
            showMore: false,
          }
        })
      }
    }

    // previous GET_ISSUES is deliberately left in place for reference
    const GET_ISSUES2 = getIssuesGQL(reposQueryParams)
    /*
      <Query
        fetchPolicy="cache-first"
        query={GET_ISSUES2}
        onError={console.error}
      >
    */
    return (
      <Query
        fetchPolicy="cache-first"
        query={GET_ISSUES2}
        onError={console.error}
      >
        {({ data, loading, error, refetch }) => {
          if (data && data.node0) {
            // first, flatten data structure into array of issues
            const { downloadedIssues, downloadedRepos } = this.flattenIssues(
              data
            )

            // then apply filtering
            const issuesFiltered = this.applyFilters(downloadedIssues)
            // then determine whether any shown repos have more issues to fetch
            const moreIssuesToShow =
              Object.keys(downloadedRepos).filter(
                repoId => downloadedRepos[repoId].hasNextPage
              ).length > 0

            return (
              <StyledIssues>
                {this.filterBar(downloadedIssues, issuesFiltered)}

                <IssuesScrollView>
                  <ScrollWrapper>
                    {this.shapeIssues(issuesFiltered)
                      .sort(currentSorter)
                      .map(issue => (
                        <Issue
                          isSelected={issue.id in this.state.selectedIssues}
                          key={issue.id}
                          {...issue}
                          onClick={this.handleIssueClick}
                          onSelect={this.handleIssueSelection}
                        />
                      ))}
                  </ScrollWrapper>

                  <div style={{ textAlign: 'center' }}>
                    {moreIssuesToShow && (
                      <Button
                        style={{ margin: '12px 0 30px 0' }}
                        mode="secondary"
                        onClick={() =>
                          this.showMoreIssues(downloadedIssues, downloadedRepos)
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

          if (loading) return this.queryLoading()

          if (error) return this.queryError(error, refetch)
        }}
      </Query>
    )
  }
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
export default Issues
