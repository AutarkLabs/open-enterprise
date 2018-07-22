import React from 'react'
import styled from 'styled-components'
import { EmptyStateCard } from '@aragon/ui'
import emptyIcon from '../assets/empty-card-icon.svg'
import RepoCard from '../components/RepoCard'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

class Overview extends React.Component {
  handleRepoSelect = repoId => {
    this.props.onSelect(repoId)
  }
  handleRepoRemove = repoId => {
    this.props.onRemove(repoId)
  }

  render () {
    const { onActivate, github } = this.props
    
    if (Object.keys(github.reposManaged).length === 0) {
      return (
        <EmptyMain>
          <EmptyStateCard
            icon={EmptyIcon}
            title="You have not added any projects."
            text="Get started now by adding a new project."
            actionText="New Project"
            onActivate={onActivate}
          />
        </EmptyMain>
      )
    }

    return (
      <StyledOverview>
        {Object.entries(github.reposManaged).map(
          ([repoId, { name, description, collaborators, commits, url }]) => (
            <RepoCard
               key={repoId}
               repoId={repoId}
               icon={emptyIcon}
               label={name}
               description={description}
               collaborators={collaborators}
               commits={commits}
               url={url}
               active={repoId === github.activeRepo}
               onSelect={this.handleRepoSelect}
               onRemove={this.handleRepoRemove}
             />
         ))}
      </StyledOverview>
    )
  }
}

const EmptyMain = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`
const StyledOverview = styled.div`
    display: grid;
    grid-template-columns: repeat(3, auto);
    grid-auto-rows: auto;
    grid-gap: 2rem;
    justify-content: start;
`;

export default Overview

