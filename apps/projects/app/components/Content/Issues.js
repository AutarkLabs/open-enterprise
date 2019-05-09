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
  breakpoint,
  Viewport,
} from '@aragon/ui'
import BigNumber from 'bignumber.js'
import { compareAsc, compareDesc } from 'date-fns'

import { STATUS } from '../../utils/github'
import { getIssuesGQL } from '../../utils/gql-queries.js'
import { DropDownButton as ActionsMenu, FilterBar, IconCurate } from '../Shared'
import { Issue, Empty } from '../Card'
import { IssueDetail } from './IssueDetail'
import Unauthorized from './Unauthorized'
import ActiveFilters from './Filters'

class Issues extends React.PureComponent {
  static propTypes = {
    onLogin: PropTypes.func.isRequired,
    githubCurrentUser: PropTypes.object.isRequired,
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
    setIssueDetail: PropTypes.func.isRequired
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
    sortBy: { what: 'Creation Date', direction: -1 },
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

  selectedIssuesArray = () =>
    Object.keys(this.state.selectedIssues).map(
      id => this.state.selectedIssues[id]
    )

  handleCurateIssues = issuesFiltered => () => {
    this.props.onCurateIssues(this.selectedIssuesArray(), issuesFiltered)
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
    this.props.setIssueDetail(true)
    this.setState({ currentIssue: issue })
  }

  handleIssueDetailClose = () => {
    this.props.setIssueDetail(false)
    this.setState({ currentIssue: null })
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

  actionsContextMenu = issuesFiltered => (
    <ActionsMenu enabled={(Object.keys(this.state.selectedIssues).length !== 0)}>
      <ContextMenuItem
        onClick={this.handleCurateIssues(issuesFiltered)}
        style={{ display: 'flex', alignItems: 'flex-start' }}
      >
        <div>
          <IconCurate color={theme.textTertiary} />
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
  )

  actionsMenu = (issues, issuesFiltered) => (
    <Viewport>
      {({ below }) =>
        below('small') ? (
          <React.Fragment>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0',
                justifyContent: 'space-between',
                alignContent: 'stretch',
                marginTop: '10px',
              }}
            >
              <TextInput
                placeholder="Search issue titles"
                type="search"
                onChange={this.handleTextFilter}
                style={{ marginRight: '6px' }}
              />
              {this.actionsContextMenu(issuesFiltered)}
            </div>
            <ActiveFilters
              issues={issues}
              bountyIssues={this.props.bountyIssues}
              filters={this.state.filters}
              disableFilter={this.disableFilter}
              disableAllFilters={this.disableAllFilters}
            />
          </React.Fragment>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0',
              justifyContent: 'space-between',
            }}
          >
            <TextInput
              placeholder="Search issue titles"
              type="search"
              onChange={this.handleTextFilter}
            />
            <ActiveFilters
              issues={issues}
              bountyIssues={this.props.bountyIssues}
              filters={this.state.filters}
              disableFilter={this.disableFilter}
              disableAllFilters={this.disableAllFilters}
            />
            {this.actionsContextMenu(issuesFiltered)}
          </div>
        )
      }
    </Viewport>
  )

  setParentFilters = filters => {
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
    )
  }

  queryLoading = () => (
    <StyledIssues>
      {this.actionsMenu([], [])}
      {this.filterBar([], [])}
      <IssuesScrollView>
        <div>Loading...</div>
      </IssuesScrollView>
    </StyledIssues>
  )

  queryError = (error, refetch) => (
    <StyledIssues>
      {this.actionsMenu([], [])}
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
    const { what, direction } = this.state.sortBy
    if (what === 'Name')
      return (i1, i2) => {
        return i1.title.toUpperCase() < i2.title.toUpperCase()
          ? direction
          : direction * -1
      }
    else if (what === 'Creation Date')
      return (i1, i2) => {
        return direction == 1
          ? compareAsc(new Date(i1.createdAt), new Date(i2.createdAt))
          : compareDesc(new Date(i1.createdAt), new Date(i2.createdAt))
      }
  }

  renderCurrentIssue = currentIssue => {
    const {
      onRequestAssignment,
      onReviewApplication,
      onSubmitWork,
      onReviewWork,
    } = this.props

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
    let totalCount = 0

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
      showIssueDetail
    } = this.props

    const { currentIssue, filters } = this.state

    // better return early if we have no projects added
    if (projects.length === 0) return <Empty action={onNewProject} />

    // same if we only need to show Issue's Details screen
    if (showIssueDetail)
      return this.renderCurrentIssue(currentIssue, this.props)

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
                {this.actionsMenu(downloadedIssues, issuesFiltered)}
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
                            onAllocateSingleBounty={
                              this.handleAllocateSingleBounty
                            }
                            onUpdateBounty={this.handleUpdateBounty}
                            onReviewWork={onReviewWork}
                          />
                        )
                      })}
                  </ScrollWrapper>

                  <div style={{ textAlign: 'center' }}>
                    {moreIssuesToShow && (
                      <Button
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
  ${breakpoint(
    'small',
    `
    padding: 1rem 2rem;
  `
  )};
  padding: 0.3rem;
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
  overflow-y: hidden;
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
