import React from 'react'
import styled from 'styled-components'
import { EmptyStateCard } from '@aragon/ui'
import emptyIcon from '../assets/empty-card-icon.svg'

const EmptyIcon = () => <img src={emptyIcon} alt="" />

const AddressBook = ({ onActivate }) => (
  <Main>
    <EmptyStateCard
      icon={EmptyIcon}
      title="You have not added anyone to the address book."
      text="Get started now by adding a new entity."
      actionText="New Entity"
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
