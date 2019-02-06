import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { EmptyStateCard, unselectable } from '@aragon/ui'
import icon from '../../assets/empty-accounts.svg'

const Icon = () => <img src={icon} alt="Empty accounts icon" />

const Empty = ({ action }) => (
  <EmptyWrapper>
    <EmptyStateCard
      title="You have not created any allocation accounts."
      text="Get started now by creating a new account."
      icon={<Icon />}
      actionText="New Account"
      onActivate={action}
    />
  </EmptyWrapper>
)

Empty.propTypes = {
  action: PropTypes.func.isRequired,
}

const EmptyWrapper = styled.div`
  ${unselectable};
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
`

export default Empty
