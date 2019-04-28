import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { EmptyStateCard, unselectable } from '@aragon/ui'
import icon from '../../assets/empty-rewards.svg'

const Icon = () => <img src={icon} alt="Empty accounts icon" />

const Empty = ({ action, tab }) => (

  <EmptyWrapper>
    <EmptyStateCard
      title={tab === 'Overview' ? 'No rewards have been created.' : 'You have not been awarded any rewards.' }
      text="Get started now by creating a new reward."
      icon={<Icon />}
      actionText="New Reward"
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
`

export default Empty
