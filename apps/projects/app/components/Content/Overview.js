import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Project, Empty } from '../Card'
import { useLayout } from '@aragon/ui'
import { CARD_STRETCH_BREAKPOINT } from '../../utils/responsive'

const Overview = ({ changeActiveIndex, projects }) => {
  const { width } = useLayout()

  const projectsEmpty = projects.length === 0
  if (projectsEmpty) {
    return <Empty />
  }

  return (
    <StyledProjects screenSize={width}>
      {projects.map((project, index) => (
        <Project
          key={index}
          label={project.metadata.name}
          description={project.metadata.description}
          id={project.id}
          repoId={project.data._repo}
          commits={project.metadata.commits}
          // TODO: Disabled for now
          // contributors={project.metadata.collaborators}
          url={project.metadata.url}
          changeActiveIndex={changeActiveIndex}
        />
      ))}
    </StyledProjects>
  )
}

Overview.propTypes = {
  changeActiveIndex: PropTypes.func.isRequired,
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const StyledProjects = styled.div`
  display: flex;
  flex-direction: ${props =>
    props.screenSize < CARD_STRETCH_BREAKPOINT ? 'column' : 'row'};
  flex-wrap: wrap;
`
export default Overview
