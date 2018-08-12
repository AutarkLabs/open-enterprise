import React from 'react'
import styled from 'styled-components'

import { RepoCard } from '../Card'

class Overview extends React.Component {
  handleRepoSelect = repoId => {
    this.props.onSelect(repoId)
  }
  handleRepoRemove = repoId => {
    this.props.onRemove(repoId)
  }

  render() {
    return (
      <StyledOverview>
        <CardsWrapper>
          {Object.entries(github.reposManaged).map(
            ([repoId, { name, description, collaborators, commits, url }]) => (
              <RepoCard
                className="repo-card"
                key={repoId}
                repoId={repoId}
                // icon={IconEmpty}
                label={name}
                description={description}
                collaborators={collaborators}
                commits={commits}
                url={url}
                active={repoId === github.activeRepo}
                onSelect={this.handleRepoSelect}
                onRemove={this.handleRepoRemove}
              />
            )
          )}
        </CardsWrapper>
      </StyledOverview>
    )
  }
}

const StyledOverview = styled.section`
  padding: 30px;
  display: flex;
  height: 100%;
`

const CardsWrapper = styled.div`
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, 249px);
  grid-gap: 30px;
  grid-auto-rows: 220px;
`

export default Overview
