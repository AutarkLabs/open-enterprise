import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import {
  DataView,
  Text,
  useTheme,
} from '@aragon/ui'
import {
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT,
} from '../../utils/constants'
import { Empty } from '../Card'
import Metrics from './Metrics'

const MyRewards = ({
  myRewards,
  myMetrics,
}) => {
  const rewardsEmpty = myRewards.length === 0

  if (rewardsEmpty) {
    return <Empty />
  }
  return (
    <OverviewMain>
      <RewardsWrap>
        <Metrics content={myMetrics} />
        <DataView
          heading={<Text size="xlarge">Unclaimed rewards</Text>}
          fields={[ 'description', 'status', 'amount' ]}
          entries={myRewards}
          renderEntry={renderReward}
        />
      </RewardsWrap>
    </OverviewMain>
  )
}

const renderReward = (reward) => {
  let fields = []
  switch(reward.rewardType) {
  case ONE_TIME_DIVIDEND:
    fields = renderOneTimeDividend(reward)
    break
  case RECURRING_DIVIDEND:
    fields = renderRecurringDividend(reward)
    break
  case ONE_TIME_MERIT:
    fields = renderOneTimeMerit(reward)
    break
  }
  return fields
}

const renderOneTimeDividend = (reward) => {
  const theme = useTheme()
  const {
    description,
    amount,
    amountToken,
  } = reward
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{amount} {amountToken}
    </Text>
  )
  return [ description, 'Claim', displayAmount ]
}

const renderRecurringDividend = (reward) => {
  const theme = useTheme()
  const {
    description,
    amount,
    amountToken,
  } = reward
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{amount} {amountToken}
    </Text>
  )
  return [ description, 'Claim', displayAmount ]
}

const renderOneTimeMerit = (reward) => {
  const theme = useTheme()
  const {
    description,
    amount,
    amountToken,
  } = reward
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{amount} {amountToken}
    </Text>
  )
  return [ description, 'Claim', displayAmount ]
}

MyRewards.propTypes = {
  myRewards: PropTypes.arrayOf(PropTypes.object).isRequired,
  myMetrics: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const OverviewMain = styled.div`
  background-color: #f8fcfd;
`
const RewardsWrap = styled.div`
  flex-grow: 1;
  > :not(:last-child) {
    margin-bottom: 20px;
  }
`

// eslint-disable-next-line import/no-unused-modules
export default MyRewards
