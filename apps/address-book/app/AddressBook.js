import React from 'react'
import styled from 'styled-components'
import { EmptyStateCard } from '@aragon/ui'

import emptyIcon from './assets/empty-card-icon.svg'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

const AddressBook = ({ onActivate }) => (
  <Main>
    <EmptyStateCard
      icon={EmptyIcon}
      title="Address Book"
      text="placeholder for Address Book"
      actionText="New address entry"
      onActivate={onActivate}
    />
  </Main>
)

const Main = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

export default AddressBook
