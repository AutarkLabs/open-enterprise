import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { STATUS } from '../../utils/github'
import { Project, Empty, Error } from '../Card'
import Unauthorized from './Unauthorized'
import { LoadingAnimation } from '../Shared'
import { EmptyWrapper } from '../Shared'
import { Viewport } from '@aragon/ui'

const Overview = ({
  changeActiveIndex,
  onLogin,
  onNewProject,
  onRemoveProject,
  projects,
  githubCurrentUser,
  githubLoading,
}) => {
  if (githubLoading) {
    return <EmptyWrapper><LoadingAnimation /></EmptyWrapper>
  } else if (githubCurrentUser === STATUS.INITIAL) {
    return <Unauthorized onLogin={onLogin} />
  } else if (githubCurrentUser === STATUS.FAILED) {
    return <Error action={() => {}} />
  }

  const projectsEmpty = projects.length === 0
  if (projectsEmpty) {
    return <Empty action={onNewProject} />
  }

  return (
    <Viewport>
      {({ width }) => {
        const screenSize = width

        return (
          <StyledProjects screenSize={screenSize}>
            {projects.map((project, index) => (
              <Project
                key={index}
                label={project.metadata.name}
                description={project.metadata.description}
                onRemoveProject={onRemoveProject}
                id={project.id}
                repoId={project.data._repo}
                commits={project.metadata.commits}
                screenSize={screenSize}
                // TODO: Disabled for now
                // contributors={project.metadata.collaborators}
                url={project.metadata.url}
                changeActiveIndex={changeActiveIndex}
              />
            ))}
          </StyledProjects>
        )
      }}
    </Viewport>
  )
}

Overview.propTypes = {
  changeActiveIndex: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  onNewProject: PropTypes.func.isRequired,
  onRemoveProject: PropTypes.func.isRequired,
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
  githubCurrentUser: PropTypes.object.isRequired,
}

const StyledProjects = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: ${props => props.screenSize < 600 ? '0' : '1rem'};
`
export default Overview
