import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { EmptyStateCard, GU, unselectable, Button } from '@aragon/ui'
import icon from '../../assets/empty-rewards.svg'

const Icon = () => <img src={icon} height={20 * GU} />

const Empty = ({ action, noButton=false }) => (

  <EmptyWrapper>
    <EmptyStateCard
      text="No rewards here!"
      illustration={<Icon />}
      action={noButton ? '' : <Button label="New reward" onClick={action} />}
    />
  </EmptyWrapper>
)

Empty.propTypes = {
  action: PropTypes.func,
}

const EmptyWrapper = styled.div`
  ${unselectable};
  height: 70vh;
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

export default Empty
