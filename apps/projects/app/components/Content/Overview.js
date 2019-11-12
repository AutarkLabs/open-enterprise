import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Project, Empty } from '../Card'
import { useLayout } from '@aragon/ui'
import { CARD_STRETCH_BREAKPOINT } from '../../utils/responsive'
import { useDecoratedRepos } from '../../context/DecoratedRepos'

const Overview = ({ changeActiveIndex }) => {
  const { width } = useLayout()
  const repos = useDecoratedRepos()

  const projectsCards = useCallback(repos.map(repo => (
    <Project
      key={repo.id}
      label={repo.metadata.name}
      description={repo.metadata.description}
      id={repo.id}
      repoId={repo.data._repo}
      commits={repo.metadata.commits}
      // TODO: Disabled for now
      // contributors={repo.metadata.collaborators}
      url={repo.metadata.url}
      changeActiveIndex={changeActiveIndex}
    />
  ), [repos]
  ))

  if (!repos.length) {
    return <Empty />
  }

  return (
    <StyledProjects screenSize={width}>
      {projectsCards}
    </StyledProjects>
  )
}

Overview.propTypes = {
  changeActiveIndex: PropTypes.func.isRequired,
}

const StyledProjects = styled.div`
  display: flex;
  flex-direction: ${props =>
    props.screenSize < CARD_STRETCH_BREAKPOINT ? 'column' : 'row'};
  flex-wrap: wrap;
`
export default Overview
