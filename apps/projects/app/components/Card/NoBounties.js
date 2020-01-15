import React from 'react'
import styled from 'styled-components'
import { Card, GU, Text } from '@aragon/ui'

import noDataPng from '../../assets/noData.png'

const NoBounties = () => {
  return (
    <EmptyCard>
      <div
        css={`
        display: flex;
        flex-direction: column;
        align-items: center;
      `}
      >
        <img css={`margin-bottom: ${2 * GU}px`} src={noDataPng} alt="" height="160" />
        <Text size="xlarge" css={`margin: ${2 * GU}px`}>
            No bounties here
        </Text>
        <Text>
          Create an issue and fund it to unlock this tab
        </Text>
      </div>
    </EmptyCard>
  )
}

const EmptyCard = styled(Card)`
  width: 100%;
  height: auto;
  padding: ${7 * GU}px;
`

export default NoBounties
