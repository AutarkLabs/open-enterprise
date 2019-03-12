import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Empty } from '../Card'

const MyRewards = (props) => {
  const rewardsEmpty = props.rewards.length === 0

  if (rewardsEmpty) {
    return <Empty tab='MyRewards' action={props.onNewReward} />
  }

  return <StyledRewards>My Rewards Go Here</StyledRewards>
}

MyRewards.propTypes = {
  onNewReward: PropTypes.func.isRequired,
  rewards: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const StyledRewards = styled.div`
  display: table;
  justify-content: start;
  padding: 30px;
`
export default MyRewards
