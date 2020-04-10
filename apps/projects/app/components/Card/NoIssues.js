import React from 'react'
import styled from 'styled-components'
import { Button, Card, GU, textStyle } from '@aragon/ui'
import { usePanelManagement } from '../Panel'

import unauthorizedSvg from '../../assets/empty.svg'

const Empty = () => {
  const { setupNewIssue } = usePanelManagement()

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
          No issues here
        </h2>
        <Button mode="strong" onClick={setupNewIssue}>New issue</Button>
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
