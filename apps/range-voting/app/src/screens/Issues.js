import React from 'react'
import styled from 'styled-components'
import { EmptyStateCard, Text, DropDown, Table, TableRow, TableCell } from '@aragon/ui'
import emptyIcon from '../assets/empty-card-icon.svg'
const EmptyIcon = () => <img src={emptyIcon} alt="" />

const EmptyMain = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

class Issues extends React.Component {
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
    const reposNames = Object.keys(repos).map((repoId) => {return repos[repoId].name})

    const activeRepoName = github.activeRepo ? repos[github.activeRepo].name : ''
    const activeRepoNameIndex = reposNames.indexOf(activeRepoName)
    const issues = github.activeRepo ? repos[github.activeRepo].issues : []
    const issuesTitles = issues.map((issue) => { return (
      <TableRow>
        <TableCell>
          <Text>{issue.node.title}</Text>
        </TableCell>
      </TableRow>
    )})

    return (
      <IssuesMain>
        <DropDown items={reposNames} active={activeRepoNameIndex} />
        <Table>
          {issuesTitles}
        </Table>
      </IssuesMain>
    )
  }
}

const IssuesMain = styled.div`
  margin-top: 10px;
`

export default Issues

