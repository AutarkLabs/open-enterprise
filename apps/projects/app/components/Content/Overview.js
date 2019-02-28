import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { STATUS } from '../../utils/github'
import { Project, Empty } from '../Card'
import Unauthorized from './Unauthorized'

const Overview = ({
  changeActiveIndex,
  onLogin,
  onNewProject,
  onRemoveProject,
  projects,
  status,
}) => {
  if (status === STATUS.INITIAL) {
    return <Unauthorized onLogin={onLogin} />
  }
  const projectsEmpty = projects.length === 0
  // console.log('Overview projects:', projects)
  if (projectsEmpty) {
    return <Empty action={onNewProject} />
  }
  const projectsMap = projects.map((project, index) => (
    <Project
      key={index}
      label={project.metadata.name}
      description={project.metadata.description}
      onRemoveProject={onRemoveProject}
      id={project.id}
      repoId={project.data._repo}
      commits={project.metadata.commits}
      contributors={project.metadata.collaborators}
      url={project.metadata.url}
      changeActiveIndex={changeActiveIndex}
    />
  ))
  return <StyledProjects>{projectsMap}</StyledProjects>
}

Overview.propTypes = {
  changeActiveIndex: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  onNewProject: PropTypes.func.isRequired,
  onRemoveProject: PropTypes.func.isRequired,
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
  status: PropTypes.string.isRequired,
}

const StyledProjects = styled.div`
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-auto-rows: auto;
  grid-gap: 2rem;
  justify-content: start;
  padding: 30px;
`

export default Overview
