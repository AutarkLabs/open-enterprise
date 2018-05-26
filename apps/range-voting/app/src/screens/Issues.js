import React from 'react'
import styled from 'styled-components'
import { SidePanel, theme, SafeLink, EmptyStateCard, Text, DropDown, Table, TableRow, TableCell, TableHeader, Button } from '@aragon/ui'
import emptyIcon from '../assets/empty-card-icon.svg'
import CheckboxInput from '../components/Checkbox'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

const EmptyMain = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

class Issues extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      activeBountyName: 'All',
      allocateBountiesVisible: false,
      selectedAllIssues: false,
      selectedIssues: {},
      visibleIssues: [],
      visibleLabels: {},
      visibleMilestones: {},
      visibleBounties: {}
    }
  }

  handleAllocateBountiesOpen = () => {
    this.setState({ allocateBountiesVisible: true })
  }

  handleAllocateBountiesClose = () => {
    this.setState({ allocateBountiesVisible: false })
  }

  componentDidMount() {
    this.filterIssues()
  }

  handleRepoSelect = index => {
    const { github } = this.props

    const newRepoId = index ?
      Object.keys(github.reposManaged)[index - 1] // because [0] == 'All'
      :
      ''
    this.props.handleRepoSelect(newRepoId)
    this.filterIssues()
  }

  generateHandleLabelSelect = labelsNames => {
    return index => {
      const newLabel = index ?
        labelsNames[index]
        :
        ''

      this.props.handleLabelSelect(newLabel)
      this.filterIssues()
    }
  }

   generateHandleLabelClick = newLabel => {
    return () => {
      this.props.handleLabelSelect(newLabel)
    }
  }

   generateHandleMilestoneSelect = milestonesNames => {
    return index => {
      const newMilestone = index ?
        milestonesNames[index]
        :
        ''
      this.props.handleMilestoneSelect(newMilestone)
      this.filterIssues()
    }
  }

  generateCheckboxHandler = issueIndex => {
    return isChecked => {
      const { visibleIssues, selectedIssues } = this.state
      const issueId = visibleIssues[issueIndex].node.id
      if (isChecked) {
        selectedIssues[issueId] = visibleIssues[issueIndex]
        this.setState({ selectedIssues: selectedIssues })
      } else {
        delete selectedIssues[issueId]
        this.setState({ selectedIssues: selectedIssues, selectedAllIssues: false })
      }
    }
  }

  checkboxAllHandler = (isChecked) => {
    if (isChecked) {
      const { visibleIssues } =  this.state
      const selectedIssues = []
      visibleIssues.forEach((issue) => { selectedIssues[issue.node.id] = issue })
      this.setState({ selectedIssues: selectedIssues, selectedAllIssues: true })
    } else {
      this.setState({ selectedIssues: [], selectedAllIssues: false })
    }
  }

  filterIssues() {
    const { github } = this.props
    const activeLabelName = github.activeLabelName ? github.activeLabelName : 'All'
    const activeMilestoneName = github.activeMilestoneName ? github.activeMilestoneName : 'All'
    const repos = github.reposManaged
    var issues = [], labels = {}, milestones = {}

    if (github.activeRepo) {
      issues = repos[github.activeRepo].issues
      labels = repos[github.activeRepo].labels
      milestones = repos[github.activeRepo].milestones
    } else {
      Object.keys(repos).forEach( (repoId) => {
        issues.push(...repos[repoId].issues)
        labels = {...labels, ...repos[repoId].labels}
        milestones = {...milestones, ...repos[repoId].milestones}
      })
    }

    if (activeLabelName !== 'All') {
      issues = issues.filter((issue) => {
        let found = false
        issue.node.labels.edges.forEach(
          label => {
            if (label.node.name === activeLabelName) {
            found = true
            }
          }
        )
        return found
      })
    }
    if (activeMilestoneName !== 'All') {
      issues = issues.filter((issue) => {
        return issue.milestone.title === activeMilestoneName
      })
    }
    this.setState({visibleIssues: issues, visibleLabels: labels, visibleMilestones: milestones})
  }

  render() {
    const { onActivate, github } = this.props
    const { visibleIssues, visibleLabels, visibleMilestones, activeBountyName, allocateBountiesVisible, selectedIssues } =  this.state

    if (Object.keys(github.reposManaged).length === 0) {
      return (
        <EmptyMain >
          <EmptyStateCard
            icon={EmptyIcon}
            title="You have no added any projects."
            text="Get started now by adding a new project."
            actionText="New Project"
            onActivate={onActivate}
          />
        </EmptyMain>
      )
    }

    const repos = github.reposManaged
    // names of repos for repo Select
    const reposNames = ['All', ...Object.keys(repos).map((repoId) => {return repos[repoId].name})]

    // determine names of active positions in selects
    const activeRepoName = github.activeRepo ? repos[github.activeRepo].name : 'All'
    const activeLabelName = github.activeLabelName ? github.activeLabelName : 'All'
    const activeMilestoneName = github.activeMilestoneName ? github.activeMilestoneName : 'All'

    // names and indexes for Selects options
    const activeRepoNameIndex = reposNames.indexOf(activeRepoName)
    const labelsNames = ['All', ...Object.keys(visibleLabels).map((labelId) => {return visibleLabels[labelId].name})]
    const activeLabelNameIndex = labelsNames.indexOf(activeLabelName)
    const milestonesNames = ['All', ...Object.keys(visibleMilestones).map((milestoneId) => {return visibleMilestones[milestoneId].title})]
    const activeMilestoneNameIndex = milestonesNames.indexOf(activeMilestoneName)
    const bountiesNames = ['All', 'None', 'xs', 's', 'm', 'l', 'xl']
    const activeBountyNameIndex = bountiesNames.indexOf(activeBountyName)

/*
          <Text weight='bold'>{issue.node.title}</Text>
          {
            issue.node.labels.edges.map( label => {
              const link = 'https://github.com/' +
                issue.node.repository.nameWithOwner +
                '/issues?q=is:issue+is:open+label:"' +
                encodeURIComponent(label.node.name) +
                '"'

              return (
                <SafeLink key={label.node.id} style={{ textDecoration: 'none' }} href={link} target="_blank">
                 <Label key={'L'+label.node.id} color={label.node.color}>{label.node.name}</Label>
                </SafeLink>
              )
            })
          }
 */
    const issuesTableRows = visibleIssues.map((issue, index) => {
      const checkboxHandler = this.generateCheckboxHandler(index)
      return (
      <TableRow key={issue.node.id}>
        <TableCell>
          <CheckboxInput isChecked={issue.node.id in selectedIssues} onClick={checkboxHandler} />
        </TableCell>
        <TableCell>
          <Text>{issue.node.repository.name} #{issue.node.number}</Text>
        </TableCell>
        <TableCell>
          <SafeLink style={{ textDecoration: 'none' }} href={issue.node.url} target="_blank">
            <Text weight='bold'>{issue.node.title}</Text>
          </SafeLink>
          {
            issue.node.labels.edges.map( label => {
              const handleLabelClick = this.generateHandleLabelClick(label.node.name)
              return (
                 <Label key={'L'+label.node.id} color={label.node.color} onClick={handleLabelClick}>{label.node.name}</Label>
              )
            })
          }
        </TableCell>
        <TableCell>
          <Text>{issue.node.createdAt}</Text>
        </TableCell>
        <TableCell>
          <Text>?</Text>
        </TableCell>
      </TableRow>
    )})

    const handleLabelSelect = this.generateHandleLabelSelect(labelsNames)

    return (
      <IssuesMain>
        <Filters>
          <Filter>
            <DropDownLabel>Projects</DropDownLabel>
            <DropDown items={reposNames} active={activeRepoNameIndex} onChange={this.handleRepoSelect} />
          </Filter><Filter>
            <DropDownLabel>Labels</DropDownLabel>
            <DropDown items={labelsNames} active={activeLabelNameIndex} onChange={handleLabelSelect} />
          </Filter><Filter>
            <DropDownLabel>Milestones</DropDownLabel>
            <DropDown items={milestonesNames} active={activeMilestoneNameIndex} onChange={this.handleMilestoneSelect} />
          </Filter><Filter>
            <DropDownLabel>Bounty</DropDownLabel>
            <DropDown items={bountiesNames} active={activeBountyNameIndex} onChange={this.handleBountySelect} />
          </Filter>
          <Button
            mode={Object.keys(this.state.selectedIssues).length ? 'strong' : 'disabled'}
            onClick={Object.keys(this.state.selectedIssues).length ? this.handleAllocateBountiesOpen : null}
          >
            
            Allocate Bounties
          </Button>
        </Filters>
        <Table
          header={
            <TableRow>
              <th style={{ width: '20px' }}>
                 <CheckboxInput onClick={this.checkboxAllHandler} isChecked={this.state.selectedAllIssues} />
              </th>
              <TableHeader title="Issue" />
              <TableHeader title="Title" />
              <TableHeader title="Created" />
              <TableHeader title="Bounty" />
            </TableRow>
          }
        >
          {issuesTableRows}
        </Table>
        
        <SidePanel
          title="Allocate Bounties"
          opened={allocateBountiesVisible}
          onClose={this.handleAllocateBountiesClose}
        >
          <Table>
            { Object.keys(selectedIssues).map((issueId) => {
              const issue = selectedIssues[issueId].node
              return (
              <TableRow key={issueId}>
                <TableCell>
                  {issue.title}
                </TableCell>
              </TableRow>
            )})
            }
          </Table>
        </SidePanel>

      </IssuesMain>
    )
  }
}

const IssuesMain = styled.div`
  margin-top: 0px;
`

const DropDownLabel = styled.span`
  font-size: 11px;
  font-weight: 200;
  text-transform: uppercase;
  color: ${theme.textSecondary};
  margin-right: 5px;
`

const Label = styled.span`
  background-color: #${props => props.color};
  height: 20px;
  padding: 0.15em 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 15px;
  border-radius: 2px;
  box-shadow: inset 0 -1px 0 rgba(27,31,35,0.12);
  margin-left: 3px;
  cursor: pointer;
`
const Filter = styled.div`
  margin-right: 20px;
`

const Filters = styled.div`
  align-items: center;
  display: flex;
`
//  justify-content: space-between;

export default Issues

