import React from 'react'
import styled from 'styled-components'
import { gql } from 'apollo-boost'
import { Query } from 'react-apollo'
import {
  //   Button,
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
    console.log('let\'s curate this issues:', this.state.selectedIssues)
  }

  handleAllocateBounties = () => {
    console.log('handleAllocateBounties')
  }

  handleIssueSelection = id => {
    this.setState(({ selectedIssues }) => {
      const newSelectedIssues = selectedIssues.includes(id)
        ? selectedIssues.filter(issue => issue !== id)
        : [...new Set([].concat(...selectedIssues, id))]
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
        <IssuesScrollView>
          <Query
            query={GET_ISSUES}
            variables={{ reposIds }}
            onError={console.error}
          >
            {({ data: { nodes }, loading, error }) => {
              if (nodes) {
                return shapeIssues(flattenIssues(nodes)).map(
                  ({ id, ...issue }) => (
                    <Issue
                      isSelected={this.state.selectedIssues.includes(id)}
                      onSelect={() => {
                        this.handleIssueSelection(id)
                      }}
                      key={id}
                      {...issue}
                    />
                  )
                )
              }
              if (loading) {
                return <div>Loading...</div>
              }
              if (error) {
                console.log(error)
                return <div>Error</div>
              }
            }}
          </Query>
        </IssuesScrollView>
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
