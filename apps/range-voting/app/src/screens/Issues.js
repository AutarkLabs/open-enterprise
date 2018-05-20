import React from 'react'
import styled from 'styled-components'
import { theme, SafeLink, EmptyStateCard, Text, DropDown, Table, TableRow, TableCell, TableHeader, Button } from '@aragon/ui'
import emptyIcon from '../assets/empty-card-icon.svg'
const EmptyIcon = () => <img src={emptyIcon} alt="" />

const EmptyMain = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

class Issues extends React.Component {
  handleRepoSelect = index => {
    const { github } = this.props

    const newRepoId = index ?
      Object.keys(github.reposManaged)[index - 1] // because [0] == 'All'
      :
      ''

    console.log('repo changed to ' + newRepoId)
    this.props.handleRepoSelect(newRepoId)
  }

  allIssues () {
    const { github } = this.props
    const repos = github.reposManaged
    const a = []
    Object.keys(repos).forEach( (repoId) => { a.push(...repos[repoId].issues) })
    return a
  }

  render () {
    const { onActivate, github } = this.props

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
    const reposNames = ['All', ...Object.keys(repos).map((repoId) => {return repos[repoId].name})]

    const activeRepoName = github.activeRepo ? repos[github.activeRepo].name : 'All'

    const activeRepoNameIndex = reposNames.indexOf(activeRepoName)

    const issues = github.activeRepo ? repos[github.activeRepo].issues : this.allIssues ()

const lables

const milestones

    const issuesTableRows = issues.map((issue) => { return (
      <TableRow key={issue.node.id}>
        <TableCell>
          <Text>{issue.node.repository.name} #{issue.node.number}</Text>
        </TableCell>
        <TableCell>
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
        </TableCell>
        <TableCell>
          <Text>{issue.node.createdAt}</Text>
        </TableCell>
        <TableCell>
          <Text>?</Text>
        </TableCell>
      </TableRow>
    )})

    return (
      <IssuesMain>
        <Filters>
          <Filter>
            <DropDownLabel>Projects</DropDownLabel>
            <DropDown items={reposNames} active={activeRepoNameIndex} onChange={this.handleRepoSelect} />
          </Filter><Filter>
            <DropDownLabel>Labels</DropDownLabel>
            <DropDown items={reposNames} active={activeRepoNameIndex} onChange={this.handleRepoSelect} />
          </Filter><Filter>
            <DropDownLabel>Milestones</DropDownLabel>
            <DropDown items={reposNames} active={activeRepoNameIndex} onChange={this.handleRepoSelect} />
          </Filter><Filter>
            <DropDownLabel>Bounty</DropDownLabel>
            <DropDown items={reposNames} active={activeRepoNameIndex} onChange={this.handleRepoSelect} />
          </Filter>
          <Button>
            Allocate Bounties
          </Button>
        </Filters>
        <Table
          header={
            <TableRow>
              <TableHeader title="Issue" />
              <TableHeader title="Title" />
              <TableHeader title="Created" />
              <TableHeader title="Bounty" />
            </TableRow>
          }
        >
          {issuesTableRows}
        </Table>
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

