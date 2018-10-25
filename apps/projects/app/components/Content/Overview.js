import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { RepoCard } from '../Card'

import { Project, EmptyProjects } from '../Card'

const Repos = ({
  projects,
  onSelect
}) => (
        <CardsWrapper>
          {Object.entries(projects).map(
            ([repoId, { name, description, collaborators, commits, url }]) => (
              <RepoCard
                className="repo-card"
                key={repoId}
                repoId={repoId}
                label={name}
                description={description}
                collaborators={collaborators}
                commits={commits}
                url={url}
                active={repoId === 1}
                onSelect={onSelect}
//                onRemove={this.handleRepoRemove}
              />
            )
          )}
        </CardsWrapper>
)

const Overview = ({
  projects,
  onNewProject,
  onSelect
}) => {
  if (Object.keys(projects).length === 0) {
    return <EmptyProjects action={onNewProject} />
  }
  return (
    <StyledProjects>
      <Repos projects={projects} onSelect={onSelect} />
    </StyledProjects>
  )
}

Overview.propTypes = {
  projects: PropTypes.object.isRequired,
  onNewProject: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
}

const StyledProjects = styled.section`
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

