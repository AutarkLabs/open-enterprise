import React from 'react'
import RewardSummary from '../RewardSummary'
import { useTheme } from '@aragon/ui'

const ViewReward = (reward) => {
  const theme = useTheme()
  return (
    <RewardSummary
      reward={reward}
      theme={theme}
    />
  )
}

export default ViewReward
