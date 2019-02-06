import React from 'react'
import styled from 'styled-components'
import { gql } from 'apollo-boost'
import { Query } from 'react-apollo'
import {
  Button,
  //   Dropdown,
  //   Text,
  TextInput,
  theme,
  ContextMenuItem,
  IconShare,
  IconAdd,
} from '@aragon/ui'

import { DropDownButton as ActionsMenu, FilterBar } from '../Shared'
import { Issue, Empty } from '../Card'
import { GET_ISSUES } from '../../utils/gql-queries.js'

// import ethereumLoadingAnimation from '../Shared/assets/svg/ethereum-loading.svg'

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
    textFilter: '',
    reload: false,
  }

  handleCurateIssues = () => {
    this.props.onCurateIssues(this.state.selectedIssues)
  }

  handleAllocateBounties = () => {
    this.props.onAllocateBounties(this.state.selectedIssues)
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
    this.setState({ filters, reload: !this.state.reload })
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
      return issuesByMilestone.filter(issue => issue.title.match(textFilter))
    }

    return issuesByMilestone
  }

  handleIssueSelection = issue => {
    this.setState(({ selectedIssues }) => {
      const newSelectedIssues = selectedIssues
        .map(selectedIssue => selectedIssue.id)
        .includes(issue.id)
        ? selectedIssues.filter(selectedIssue => selectedIssue.id !== issue.id)
        : [...new Set([].concat(...selectedIssues, issue))]
      return { selectedIssues: newSelectedIssues }
    })
  }

  handleTextFilter = e => {
    this.setState({ textFilter: e.target.value, reload: !this.state.reload })
  }

  actionsMenu = () => (
    <div>
      <TextInput 
        placeholder="Search Issues"
        onChange={this.handleTextFilter}
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

  queryLoading = () => (
    <StyledIssues>
      {this.actionsMenu()}
      <FilterBar
        handleSelectAll={this.toggleSelectAll}
        allSelected={false}
        issues={[]}
        issuesFiltered={[]}
        handleFiltering={this.handleFiltering}
      />
      <IssuesScrollView>
        <div>Loading...</div>
      </IssuesScrollView>
    </StyledIssues>
  )

  queryError = (error, refetch) => (
    <StyledIssues>
      {this.actionsMenu()}
      <FilterBar
        handleSelectAll={this.toggleSelectAll}
        allSelected={false}
        issues={[]}
        issuesFiltered={[]}
        handleFiltering={this.handleFiltering}
      />
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
    const { projects, onNewProject } = this.props
    // better return early if we have no projects added?
    if (projects.length === 0) return <Empty action={onNewProject} />

    const { allSelected } = this.state
    const reposIds = projects.map(project => project.data._repo)

    const flattenIssues = nodes =>
      nodes && [].concat(...nodes.map(node => node.issues.nodes))

    const shapeIssues = issues =>
      issues.map(({ __typename, repository: { name }, ...fields }) => ({
        ...fields,
        repo: name,
      }))

    //console.log('current issues props:', this.props, 'and state:', this.state)

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
                <FilterBar
                  handleSelectAll={this.toggleSelectAll(issuesFiltered)}
                  allSelected={allSelected}
                  issues={issues}
                  issuesFiltered={issuesFiltered}
                  handleFiltering={this.handleFiltering}
                />
                <IssuesScrollView>
                  {shapeIssues(issuesFiltered).map(issue => (
                    <Issue
                      isSelected={this.state.selectedIssues
                        .map(selectedIssue => selectedIssue.id)
                        .includes(issue.id)}
                      onSelect={() => {
                        this.handleIssueSelection(issue)
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
  display: flex;
  flex-direction: column;
  padding: 15px 30px;
  > :first-child {
    display: flex;
    justify-content: space-between;
  }

  /* height: 100%;
  padding: 15px 30px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  > :nth-child(3) {
    border-radius: 3px 3px 0 0;
    margin-bottom: -1px;
  }
  > :nth-child(n + 4) {
    border-radius: 0;
    margin-bottom: -1px;
  }
  > :last-child {
    border-radius: 0 0 3px 3px;
  } */
`

const IssuesScrollView = styled.div`
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`

const ActionLabel = styled.span`
  margin-left: 15px;
`

export default Issues
