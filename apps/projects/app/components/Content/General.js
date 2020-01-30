import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { Project, NoProjects } from '../Card'
import { Button, IconPlus, Header, useLayout } from '@aragon/ui'
import { CARD_STRETCH_BREAKPOINT } from '../../utils/responsive'
import { useDecoratedRepos } from '../../context/DecoratedRepos'
import { usePanelManagement } from '../Panel'
import { Tabs } from '../Shared'

function Wrap({ children }) {
  const { setupNewProject } = usePanelManagement()
  return (
    <>
      <Header
        primary="Projects"
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={setupNewProject} label="New project" />
        }
      />
      <Tabs />
      {children}
    </>
  )
}

Wrap.propTypes = {
  children: PropTypes.node.isRequired,
}

const General = () => {
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
    />
  ), [repos]
  ))

  if (!repos.length) {
    return <Wrap><NoProjects /></Wrap>
  }

  return (
    <Wrap>
      <StyledProjects screenSize={width}>
        {projectsCards}
      </StyledProjects>
    </Wrap>
  )
}

const StyledProjects = styled.div`
  display: flex;
  flex-direction: ${props =>
    props.screenSize < CARD_STRETCH_BREAKPOINT ? 'column' : 'row'};
  flex-wrap: wrap;
`
export default General
