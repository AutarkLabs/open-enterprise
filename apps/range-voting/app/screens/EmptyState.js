import React from 'react'
import styled from 'styled-components'
import { EmptyStateCard } from '@aragon/ui'
import emptyIcon from '../assets/empty-card-icon.svg'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

const EmptyState = ({ onActivate }) => (
  <Main>
    <EmptyStateCard
      icon={EmptyIcon}
      title="You have not created any range votes."
      text="Use the Allocations or Planning apps to get started."
      actionButton={Main}
    />
  </Main>
)

const Main = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

export default EmptyState
