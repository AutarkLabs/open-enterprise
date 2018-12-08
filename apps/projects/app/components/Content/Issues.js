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
import { Issue } from '../Card'

// import ethereumLoadingAnimation from '../Shared/assets/svg/ethereum-loading.svg'

export const GET_ISSUES = gql`
  query getIssuesForRepos($reposIds: [ID!]!) {
    nodes(ids: $reposIds) {
      ... on Repository {
        issues(first: 20) {
          nodes {
            number
            id
            title
            repository {
              name
            }
          }
        }
      }
    }
  }
`

class Issues extends React.PureComponent {
  state = {
    selectedIssues: [],
  }
  handleCurateIssues = () => {
    this.props.onCurateIssues(this.state.selectedIssues)
  }

  handleAllocateBounties = () => {
    console.log('handleAllocateBounties')
    this.props.onAllocateBounties(this.state.selectedIssues)
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

  render() {
    const { projects } = this.props
    const reposIds = projects.map(project => project.data.repo)

    const flattenIssues = nodes =>
      nodes && [].concat(...nodes.map(node => node.issues.nodes))

    const shapeIssues = issues =>
      issues.map(({ __typename, repository: { name }, ...fields }) => ({
        ...fields,
        repo: name,
      }))

    console.log('current issues props:', this.props, 'and state:', this.state)
    return (
      <StyledIssues>
        <div>
          <TextInput />
          {/* // TODO: Here it goes the active filters box */}
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
        <FilterBar />
        {reposIds.length > 0 && (
          <IssuesScrollView>
            <Query
              fetchPolicy="cache-first"
              query={GET_ISSUES}
              variables={{ reposIds }}
              onError={console.error}
            >
              {({ data, loading, error, refetch }) => {
                if (data && data.nodes) {
                  return shapeIssues(flattenIssues(data.nodes)).map(issue => (
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
                  ))
                }
                if (loading) {
                  return <div>Loading...</div>
                }
                if (error) {
                  console.log(error)
                  return (
                    <div>
                      Error {JSON.stringify(error)}
                      <div>
                        <Button mode="strong" onClick={() => refetch()}>
                          Try refetching?
                        </Button>
                      </div>
                    </div>
                  )
                }
              }}
            </Query>
          </IssuesScrollView>
        )}
      </StyledIssues>
    )
  }
}

const StyledIssues = styled.div`
  overflow: hidden;
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
