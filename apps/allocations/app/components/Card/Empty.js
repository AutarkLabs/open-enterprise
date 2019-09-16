import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, EmptyStateCard, unselectable } from '@aragon/ui'
import icon from '../../assets/empty-accounts.svg'

const Icon = () => <img src={icon} alt="Empty accounts icon" />

const Empty = ({ action }) => (
  <EmptyWrapper>
    <EmptyStateCard
      text="Get started now by creating a new account."
      illustration={<Icon />}
      action={
        <Button onClick={action}>New Account</Button>
      }
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
`

export default Empty
