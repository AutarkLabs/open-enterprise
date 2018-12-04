import React from 'react'
import styled from 'styled-components'
import { unselectable } from '@aragon/ui'

import { EmptyStateCard } from '.'

const EmptyWrapper = styled.div`
  ${unselectable};
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`

const EmptyContent = props => (
  <EmptyWrapper>
    <EmptyStateCard
      title={props.emptyState.title}
      text={props.emptyState.text}
      icon={props.emptyState.icon}
      actionText={props.emptyState.actionText}
      onActivate={props.emptyState.action}
    />
  </EmptyWrapper>
)

export default EmptyContent
