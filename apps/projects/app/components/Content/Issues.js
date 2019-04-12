import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Query } from 'react-apollo'
import {
  Button,
  TextInput,
  theme,
  ContextMenuItem,
  IconFundraising,
} from '@aragon/ui'
import BigNumber from 'bignumber.js'
import { compareAsc, compareDesc } from 'date-fns'

import { STATUS } from '../../utils/github'
import { GET_ISSUES, getIssuesGQL } from '../../utils/gql-queries.js'
import { DropDownButton as ActionsMenu, FilterBar, IconCurate } from '../Shared'
import { Issue, Empty } from '../Card'
import { IssueDetail } from './IssueDetail'
import Unauthorized from './Unauthorized'
import ActiveFilters from './Filters'

class Issues extends React.PureComponent {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
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
    sortBy: { what: 'Name', direction: -1 },
    textFilter: '',
    reload: false,
    currentIssue: {},
    showIssueDetail: false,
    repos: {},
    downloadedIssues: [],
    downloadedRepos: {},
    issuesPerCall: 1,
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

  selectedIssuesArray = () =>
    Object.keys(this.state.selectedIssues).map(id => this.state.selectedIssues[id])

  handleCurateIssues = () => {
    this.props.onCurateIssues(this.selectedIssuesArray())
    // this is called from ActionMenu, on selected Issues -
    // return to default state where nothing is selected
    this.setState({ selectedIssues: [], allSelected: false })
  }

  handleAllocateSingleBounty = issue => {
    this.props.onAllocateBounties([issue])
  }

  handleUpdateBounty = issue => {
    this.props.onUpdateBounty([issue])
  }

  handleAllocateBounties = () => {
    this.props.onAllocateBounties(this.selectedIssuesArray())
    // this is called from ActionMenu, on selected Issues -
    // return to default state where nothing is selected
    this.setState({ selectedIssues: [], allSelected: false })
  }

  toggleSelectAll = issuesFiltered => () => {
    const selectedIssues = {}
    const allSelected = !this.state.allSelected
    const reload = !this.state.reload
    if (!this.state.allSelected) {
      this.shapeIssues(issuesFiltered).forEach(issue => selectedIssues[issue.id] = issue)
    }
    this.setState({ allSelected, selectedIssues, reload })
  }

  handleFiltering = filters => {
    // TODO: why is reload necessary?
    this.setState(prevState => ({ filters: filters, reload: !prevState.reload }))
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
      if ('milestoneless' in filters.milestones && issue.milestone == null)
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
      const status = bountyIssueObj[issue.number] ? bountyIssueObj[issue.number] : 'not-funded'
      // if we look for all funded issues, regardless of stage...
      let filterPass = 
        status in filters.statuses ||
          ('all-funded' in filters.statuses && status !== 'not-funded') ?
          true : false
      // ...or at specific stages
      return filterPass
    })

    // last but not least, if there is any text in textFilter...
    if (textFilter) {
      return issuesByStatus.filter(issue =>
        issue.title.toUpperCase().match(textFilter)
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
    this.setState({ showIssueDetail: true, currentIssue: issue })
  }

  handleIssueDetailClose = () => {
    this.setState({ showIssueDetail: false, currentIssue: null })
  }

  disableFilter = (pathToFilter) => {
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
      }
    })
  }

  actionsMenu = (issues) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end'
      }}>
      <TextInput placeholder="Search issue titles" type="search" onChange={this.handleTextFilter} />
      <ActiveFilters
        issues={issues}
        bountyIssues={this.props.bountyIssues}
        filters={this.state.filters}
        disableFilter={this.disableFilter}
        disableAllFilters={this.disableAllFilters}
      />
      <ActionsMenu enabled={Object.keys(this.state.selectedIssues).length > 0}>
        <ContextMenuItem
          onClick={this.handleCurateIssues}
          style={{ display: 'flex', alignItems: 'flex-start' }}
        >
          <div>{/*}
            <IconCurate color={theme.textTertiary} />
    */}
          </div>
          <ActionLabel>Curate Issues</ActionLabel>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={this.handleAllocateBounties}
          style={{ display: 'flex', alignItems: 'flex-start' }}
        >
          <div style={{ marginLeft: '4px' }}>
            <IconFundraising color={theme.textTertiary} />
          </div>
          <ActionLabel>Fund Issues</ActionLabel>
        </ContextMenuItem>
      </ActionsMenu>
    </div>
  )

  setParentFilters = (filters) => {
    this.setState(filters)
  }

  filterBar = (issues, issuesFiltered) => {
    return (
      <FilterBar
        setParentFilters={this.setParentFilters}
        filters={this.state.filters}
        handleSelectAll={this.toggleSelectAll(issuesFiltered)}
        allSelected={this.state.allSelected}
        issues={issues}
        issuesFiltered={issuesFiltered}
        handleFiltering={this.handleFiltering}
        handleSorting={this.handleSorting}
        activeIndex={this.props.activeIndex}
        bountyIssues={this.props.bountyIssues}
      />
    )}

  queryLoading = () => (
    <StyledIssues>
      {this.actionsMenu([])}
      {this.filterBar([], [])}
      <IssuesScrollView>
        <div>Loading...</div>
      </IssuesScrollView>
    </StyledIssues>
  )

  queryError = (error, refetch) => (
    <StyledIssues>
      {this.actionsMenu([])}
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

    return issues.map(({ __typename, repository: { id, name }, ...fields }) => {
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
          balance: balance
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
    const { what, direction } = this.state.sortBy
    if (what === 'Name')
      return (i1, i2) => {
        return i1.title.toUpperCase() < i2.title.toUpperCase()
          ? direction
          : direction * -1
      }
    else if (what === 'Creation Date')
      return (i1, i2) => {
        return direction == 1 ?
          compareAsc(new Date(i1.createdAt), new Date(i2.createdAt))
          :
          compareDesc(new Date(i1.createdAt), new Date(i2.createdAt))
      }
  }

  showMoreIssues = (downloadedRepos, downloadedIssues) => {
    this.setState(prevState => {
      return {
        downloadedIssues,
        downloadedRepos,
        issuesPerCall: prevState.issuesPerCall + 1,
      }
    })
  }

  render() {
    if (this.props.status === STATUS.INITIAL) {
      return <Unauthorized onLogin={this.props.onLogin} />
    }
    const {
      projects,
      onNewProject,
      onRequestAssignment,
      onReviewApplication,
      onSubmitWork,
      onReviewWork,
    } = this.props
    const { currentIssue, showIssueDetail } = this.state

    // better return early if we have no projects added?
    if (projects.length === 0) return <Empty action={onNewProject} />

    if (showIssueDetail) {

      currentIssue.repository = {
        name: currentIssue.repo,
        id: currentIssue.repoId,
        __typename: 'Repository',
      }

      const currentIssueShaped = this.shapeIssues([currentIssue])[0]

      return (
        <IssueDetail
          issue={currentIssueShaped}

          onClose={this.handleIssueDetailClose}
          onReviewApplication={onReviewApplication}
          onRequestAssignment={onRequestAssignment}
          onSubmitWork={onSubmitWork}
          onAllocateSingleBounty={this.handleAllocateSingleBounty}
          onUpdateBounty={this.handleUpdateBounty}
          onReviewWork={onReviewWork}
        />
      )
    }

    // Build an array of plain issues by flattening the data obtained from github API
    const flattenIssues = data => {
      let downloadedIssues = []
      const downloadedRepos = {}
      let totalCount = 0
      projects.forEach((project, i) => {
        if (data['node' + i]) {
          downloadedRepos[project.data._repo] = {
            totalCount: data['node' + i].issues.totalCount,
            endCursor: data['node' + i].issues.pageInfo.endCursor,
          }
          totalCount += data['node' + i].issues.totalCount
          downloadedIssues = downloadedIssues.concat(...data['node' + i].issues.nodes)
        }
      })
      // in case "Show More" was clicked
      // downloadedIssues = downloadedIssues.concat(this.state.downloadedIssues)
      const moreIssuesToShow = downloadedIssues.length < totalCount
      console.log('REPOS', downloadedRepos)
      console.log('ISSUES', downloadedIssues)
      console.log('issues.length < totalCount', downloadedIssues.length, totalCount)

      return { downloadedIssues, downloadedRepos, moreIssuesToShow }
    }

    const currentSorter = this.generateSorter()

    // totalCount means all issues (per repo), endCursor is the beginning
    // of a new batch (returned by GitHub), showMore is for requesting
    // more data
    const repos = {}
    projects.forEach(project => {
      const projectId = project.data._repo
      repos[projectId] = {
        // endCursor: this.state.downloadedRepos[projectId] ? this.state.downloadedRepos[projectId].endCursor : '',
        endCursor: '',
        fetch: this.state.issuesPerCall,
      }
    })

    const GET_ISSUES2 = getIssuesGQL(repos)

    return (
      <Query
        fetchPolicy="cache-first"
        query={GET_ISSUES2}
        onError={console.error}
      >
        {({ data, loading, error, refetch }) => {
          if (data) {
            console.log('Is data, render list', data)
            const { downloadedIssues, downloadedRepos, moreIssuesToShow } = flattenIssues(data)
            const issuesFiltered = this.applyFilters(downloadedIssues)

            return (
              <StyledIssues>
                {this.actionsMenu(downloadedIssues)}
                {this.filterBar(downloadedIssues, issuesFiltered)}

                <IssuesScrollView>
                  <ScrollWrapper>
                    {this.shapeIssues(issuesFiltered)
                      .sort(currentSorter)
                      .map((issue, index) => {
                        return (
                          <Issue
                            isSelected={issue.id in this.state.selectedIssues}
                            key={index}
                            {...issue}

                            onClick={this.handleIssueClick}
                            onSelect={this.handleIssueSelection}
                            onReviewApplication={onReviewApplication}
                            onSubmitWork={onSubmitWork}
                            onRequestAssignment={onRequestAssignment}
                            onAllocateSingleBounty={this.handleAllocateSingleBounty}
                            onUpdateBounty={this.handleUpdateBounty}
                            onReviewWork={onReviewWork}
                          />
                        )
                      })}
                  </ScrollWrapper>
                  <div style={{ textAlign: 'center' }}>
                    {moreIssuesToShow && (
                      <Button
                        mode="strong"
                        onClick={() => this.showMoreIssues(downloadedRepos, downloadedIssues)}>
                        Show More Issues
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
  padding: 15px 30px;
  > :first-child {
    display: flex;
    justify-content: space-between;
  }
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
  overflow-y: auto;
`

const ActionLabel = styled.span`
  margin-left: 15px;
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

export default Issues
