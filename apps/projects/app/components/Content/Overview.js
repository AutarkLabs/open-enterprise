import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Project, Empty } from '../Card'

const Overview = ({ projects, onNewProject, onSelect, app }) => {
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
      // id={projectId}
      // name={data.name}
      commits={project.metadata.commits}
      contributors={project.metadata.collaborators}
      // url={data.url}
    />
  ))
  return <StyledProjects>{projectsMap}</StyledProjects>
}

Overview.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
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
