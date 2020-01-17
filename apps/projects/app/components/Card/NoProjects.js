import React from 'react'
import styled from 'styled-components'
import { Button, Card, GU, Text, textStyle } from '@aragon/ui'
import { usePanelManagement } from '../Panel'

import unauthorizedSvg from '../../assets/empty.svg'

const Empty = () => {
  const { setupNewProject } = usePanelManagement()

  return (

    <EmptyCard>
      <div
        css={`
        display: flex;
        flex-direction: column;
        align-items: center;
      `}
      >
        <img css={`margin-bottom: ${2 * GU}px`} src={unauthorizedSvg} alt="" height="160" />
        <h2 css={textStyle('title2')}>
          No projects here
        </h2>
        <Text css={`margin-bottom: ${3 * GU}px; margin-top: ${GU}px`}>
          Create a project to start funding,<br />
          prioritizing and working on issues
        </Text>
        <Button mode="strong" onClick={setupNewProject}>New project</Button>
      </div>
    </EmptyCard>
  )
}

const EmptyCard = styled(Card)`
  width: 100%;
  height: auto;
  padding: ${7 * GU}px;
`

export default Empty
