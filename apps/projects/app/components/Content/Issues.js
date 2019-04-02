import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Query } from 'react-apollo'
import {
  Button,
  TextInput,
  theme,
  ContextMenuItem,
  IconShare,
  IconAdd,
} from '@aragon/ui'
import BigNumber from 'bignumber.js'
import { compareAsc, compareDesc } from 'date-fns'

import { STATUS } from '../../utils/github'
import { GET_ISSUES } from '../../utils/gql-queries.js'
import { DropDownButton as ActionsMenu, FilterBar } from '../Shared'
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
    selectedIssues: [],
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

  handleCurateIssues = () => {
    this.props.onCurateIssues(this.state.selectedIssues)
    // this is called from ActionMenu, on selected Issues -
    // return to default state where nothing is selected
    this.setState({ selectedIssues: [], allSelected: false })
  }

  handleAllocateSingleBounty = issue => {
    this.props.onAllocateBounties([issue])
  }

  handleAllocateBounties = () => {
    console.log('handleAllocationBounties:', this.state.selectedIssues)
    this.props.onAllocateBounties(this.state.selectedIssues)
    // this is called from ActionMenu, on selected Issues -
    // return to default state where nothing is selected
    this.setState({ selectedIssues: [], allSelected: false })
  }

  handleReviewApplication = issue => {
    this.props.onReviewApplication(issue)
  }

  handleReviewWork = issue => {
    this.props.onReviewWork(issue)
  }

  handleSubmitWork = issue => {
    this.props.onSubmitWork(issue)
  }

  handleRequestAssignment = issue => {
    this.props.onRequestAssignment(issue)
  }

  toggleSelectAll = issuesFiltered => () => {
    if (this.state.allSelected) {
      this.setState({ allSelected: false, selectedIssues: [] })
    } else {
      this.setState({ allSelected: true, selectedIssues: issuesFiltered })
    }
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
      if ('not-funded' in filters.statuses && !bountyIssueObj[issue.number])
        return true
      // if issues without a status should not pass, they are rejected below
      if (status === 'not-funded') return false
      if (status in filters.statuses)
        return true
      return false
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
    this.setState(({ selectedIssues }) => {
      console.log('handleIssueSelection', issue)
      const newSelectedIssues = selectedIssues
        .map(selectedIssue => selectedIssue.id)
        .includes(issue.id)
        ? selectedIssues.filter(selectedIssue => selectedIssue.id !== issue.id)
        : [...new Set([].concat(...selectedIssues, issue))]
      return { selectedIssues: newSelectedIssues }
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
      <TextInput placeholder="Search Issues" onChange={this.handleTextFilter} />
      <ActiveFilters
        issues={issues}
        bountyIssues={this.props.bountyIssues}
        filters={this.state.filters}
        disableFilter={this.disableFilter}
        disableAllFilters={this.disableAllFilters}
      />
      <ActionsMenu enabled={!!this.state.selectedIssues.length}>
        <ContextMenuItem
          onClick={this.handleCurateIssues}
          style={{ display: 'flex', alignItems: 'flex-start' }}
        >
          <div>
            <IconAdd color={theme.textTertiary} />
          </div>
          <ActionLabel>Curate Issues</ActionLabel>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={this.handleAllocateBounties}
          style={{ display: 'flex', alignItems: 'flex-start' }}
        >
          <div style={{ marginLeft: '4px' }}>
            <IconShare color={theme.textTertiary} />
          </div>
          <ActionLabel>Allocate Bounties</ActionLabel>
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

  getExpLevels = () => {
    const expLevels = []
    const a = this.props.bountySettings.expLevels.split('\t')
    for (let i = 0; i < a.length; i += 2)
      expLevels.push({ mul: a[i] / 100, name: a[i + 1] })
    return expLevels
  }

  shapeIssues = issues => {
    const { tokens, bountyIssues } = this.props
    const bountyIssueObj = {}
    const tokenObj = {}
    const expLevels = this.getExpLevels()

    bountyIssues.forEach(issue => {
      bountyIssueObj[issue.issueNumber] = issue
    })

    tokens.forEach(token => {
      tokenObj[token.addr] = {
        symbol: token.symbol,
        decimals: token.decimals,
      }
      console.log('tokenObj:', tokenObj)
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

  render() {
    if (this.props.status === STATUS.INITIAL) {
      return <Unauthorized onLogin={this.props.onLogin} />
    }
    const {
      projects,
      onNewProject,
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
          onReviewApplication={() => {
            this.handleReviewApplication(currentIssueShaped)
          }}
          onRequestAssignment={() => {
            this.handleRequestAssignment(currentIssueShaped)
          }}
          onSubmitWork={() => {
            this.handleSubmitWork(currentIssueShaped)
          }}
          onAllocateSingleBounty={() => {
            this.handleAllocateSingleBounty(currentIssueShaped)
          }}
          onReviewWork={() => {
            this.handleReviewWork(currentIssueShaped)
          }}
        />
      )
    }

    const reposIds = projects.map(project => project.data._repo)

    // Build an array of plain issues by flattening the data obtained from github API
    const flattenIssues = nodes =>
      nodes && [].concat(...nodes.map(node => node.issues.nodes))

    const currentSorter = this.generateSorter()

    return (
      <Query
        fetchPolicy="cache-first"
        query={GET_ISSUES}
        variables={{ reposIds }}
        onError={console.error}
      >
        {({ data, loading, error, refetch }) => {
          if (data && data.nodes) {
            const issues = flattenIssues(data.nodes)
            const issuesFiltered = this.applyFilters(issues)
            return (
              <StyledIssues>
                {this.actionsMenu(issues)}
                {this.filterBar(issues, issuesFiltered)}

                <IssuesScrollView>
                  <ScrollWrapper>
                    {this.shapeIssues(issuesFiltered)
                      .sort(currentSorter)
                      .map(issue => (
                        <Issue
                          isSelected={this.state.selectedIssues
                            .map(selectedIssue => selectedIssue.id)
                            .includes(issue.id)}
                          onClick={() => {
                            this.handleIssueClick(issue)
                          }}
                          onSelect={() => {
                            this.handleIssueSelection(issue)
                          }}
                          onReviewApplication={() => {
                            this.handleReviewApplication(issue)
                          }}
                          onSubmitWork={() => {
                            this.handleSubmitWork(issue)
                          }}
                          onRequestAssignment={() => {
                            this.handleRequestAssignment(issue)
                          }}
                          onAllocateSingleBounty={() => {
                            this.handleAllocateSingleBounty(issue)
                          }}
                          onReviewWork={() => {
                            this.handleReviewWork(issue)
                          }}
                          key={issue.id}
                          {...issue}
                        />
                      ))}
                  </ScrollWrapper>
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
  min-width: 600px;
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
