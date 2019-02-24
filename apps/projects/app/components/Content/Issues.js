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

import { DropDownButton as ActionsMenu, FilterBar } from '../Shared'
import { IssueDetail } from './IssueDetail'
import { Issue, Empty } from '../Card'
import { GET_ISSUES } from '../../utils/gql-queries.js'

class Issues extends React.PureComponent {
  state = {
    selectedIssues: [],
    allSelected: false,
    filters: {
      projects: {},
      labels: {},
      milestones: {},
      deadlines: {},
      experiences: {},
    },
    sortBy: { what: 'Name', direction: -1 },
    textFilter: '',
    reload: false,
    currentIssue: {},
    showIssueDetail: false,
  }

  componentWillMount() {
    if ('filterIssuesByRepoId' in this.props.activeIndex.tabData) {
      let { filters } = this.state
      filters.projects[
        this.props.activeIndex.tabData.filterIssuesByRepoId
      ] = true
      this.setState({ filters })
    }
  }

  handleCurateIssues = () => {
    this.props.onCurateIssues(this.state.selectedIssues)
  }

  handleAllocateBounties = () => {
    console.log('handleAllocationBounties:', this.state.selectedIssues)
    this.props.onAllocateBounties(this.state.selectedIssues)
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
    this.setState(prevState => ({ filters, reload: !prevState.reload }))
  }

  handleSorting = sortBy => {
    // TODO: why is reload necessary?
    this.setState(prevState => ({ sortBy, reload: !prevState.reload }))
  }

  applyFilters = issues => {
    const { filters, textFilter } = this.state

    const issuesByProject = issues.filter(issue => {
      if (Object.keys(filters.projects).length === 0) return true
      if (Object.keys(filters.projects).indexOf(issue.repository.id) !== -1)
        return true
      return false
    })
    //console.log('FILTER PROJECT: ', issuesByProject)

    const issuesByLabel = issuesByProject.filter(issue => {
      // if there are no labels to filter by, pass all
      if (Object.keys(filters.labels).length === 0) return true
      // if labelless issues are allowed, let them pass
      if ('labelless' in filters.labels && issue.labels.totalCount === 0)
        return true
      // otherwise, fail all issues without labels
      if (issue.labels.totalCount === 0) return false

      let labelsIds = issue.labels.edges.map(label => label.node.id)

      if (
        Object.keys(filters.labels).filter(id => labelsIds.indexOf(id) !== -1)
          .length > 0
      )
        return true
      return false
    })
    //console.log('FILTER LABEL: ', issuesByLabel)

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
    //console.log('FILTER MS: ', issuesByMilestone)

    // last but not least, if there is any text in textFilter...
    if (textFilter) {
      return issuesByMilestone.filter(issue => issue.title.toUpperCase().match(textFilter))
    }

    return issuesByMilestone
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
    this.setState({ textFilter: e.target.value.toUpperCase(), reload: !this.state.reload })
  }

  handleIssueClick = issue => {
    this.setState({ showIssueDetail: true, currentIssue: issue })
  }

  handleIssueDetailClose = () => {
    this.setState({ showIssueDetail: false, currentIssue: null })
  }

  actionsMenu = () => (
    <div>
      <TextInput placeholder="Search Issues" onChange={this.handleTextFilter} />
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

  filterBar = (issues, issuesFiltered) => (
    <FilterBar
      handleSelectAll={this.toggleSelectAll(issuesFiltered)}
      allSelected={this.state.allSelected}
      issues={issues}
      issuesFiltered={issuesFiltered}
      handleFiltering={this.handleFiltering}
      handleSorting={this.handleSorting}
      activeIndex={this.props.activeIndex}
    />
  )

  queryLoading = () => (
    <StyledIssues>
      {this.actionsMenu()}
      {this.filterBar([], [])}
      <IssuesScrollView>
        <div>Loading...</div>
      </IssuesScrollView>
    </StyledIssues>
  )

  queryError = (error, refetch) => (
    <StyledIssues>
      {this.actionsMenu()}
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
    const { tokens, bountyIssues } =  this.props
    let bountyIssueObj = {}
    let tokenObj = {}

    bountyIssues.forEach(issue => {
      bountyIssueObj[issue.issueNumber] = issue
    })

    tokens.forEach(token => {
      tokenObj[token.addr] = token.symbol
      console.log('tokenObj:', tokenObj)
    })
    return issues.map(({ __typename, repository: { id, name }, ...fields }) => 
    {
      if(bountyIssueObj[fields.number]){
        let data = bountyIssueObj[fields.number].data
        console.log('Bounty Issue Info:', data)

        return { 
          ...fields,
          ...bountyIssueObj[fields.number].data,
          repoId: id,
          repo: name,
          symbol: tokenObj[data.token]
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
    if (what === 'Name') return (i1, i2) => {
      return i1.title.toUpperCase() < i2.title.toUpperCase() ? direction : direction * -1
    }
  }

  render() {
    const { projects, onNewProject } = this.props
    const { currentIssue, showIssueDetail } = this.state

    // better return early if we have no projects added?
    if (projects.length === 0) return <Empty action={onNewProject} />  
    if (showIssueDetail)
      return (
        <IssueDetail
          issue={currentIssue}
          onClose={this.handleIssueDetailClose}
          handleReviewApplication = {() => {
            this.handleReviewApplication(issue)
          }}
          handleRequestAssignment = {() => {
            this.handleRequestAssignment(issue)
          }}
          handleSubmitWork = {() => {
            this.handleSubmitWork(issue)
          }}
        />
      )

    const { allSelected } = this.state
    const reposIds = projects.map(project => project.data._repo)

    // Build an array of plain issues by flattening the data obtained from github API
    const flattenIssues = nodes =>
      nodes && [].concat(...nodes.map(node => node.issues.nodes))


    //console.log('current issues props:', this.props, 'and state:', this.state)

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
            let issues = flattenIssues(data.nodes)
            let issuesFiltered = this.applyFilters(issues)
            return (
              <StyledIssues>
                {this.actionsMenu()}
                {this.filterBar(issues, issuesFiltered)}

                <IssuesScrollView>
                  {this.shapeIssues(issuesFiltered).sort(currentSorter).map(issue => (
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
                      onReviewWork={() => {
                        this.handleReviewWork(issue)
                      }}
                      key={issue.id}
                      {...issue}
                    />
                  ))}
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

export default Issues
