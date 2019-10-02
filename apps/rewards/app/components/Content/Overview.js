import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import moment from 'moment'
import {
  DataView,
  Link,
  Text,
  useTheme,
} from '@aragon/ui'
import {
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT,
  RECURRING,
  ONE_TIME,
  MERIT,
  DIVIDEND
} from '../../utils/constants'
import { Empty } from '../Card'
import Metrics from './Metrics'

const Overview = ({
  rewards,
  newReward,
  viewReward,
  metrics,
}) => {
  const rewardsEmpty = rewards.length === 0

  if (rewardsEmpty) {
    return <Empty action={newReward} />
  }
  return (
    <OverviewMain>
      <RewardsWrap>
        <Metrics content={metrics} />
        <DataView
          heading={<Text size="xlarge">Current rewards</Text>}
          fields={[ 'description', 'type', 'frequency', 'next payout', 'amount' ]}
          entries={rewards}
          renderEntry={(reward) => renderReward(reward, viewReward)}
        />
      </RewardsWrap>
    </OverviewMain>
  )
}

const renderReward = (reward, viewReward) => {
  const theme = useTheme()
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
  return fields.map(f => (
    <Link
      onClick={() => viewReward(reward)}
      css={{
        color: theme.content
      }}
    >
      {f}
    </Link>
  ))
}

const renderOneTimeDividend = (reward) => {
  const {
    description,
    amount,
    amountToken,
    dateReference,
  } = reward
  const nextPayout = dateReference.toDateString()
  const displayAmount = `${amount} ${amountToken}`
  return [ description, DIVIDEND, ONE_TIME, nextPayout, displayAmount ]
}

const renderRecurringDividend = (reward) => {
  const {
    description,
    amount,
    amountToken,
    disbursement,
    disbursementUnit,
    disbursements,
  } = reward
  const frequency = `${RECURRING} (${disbursement} ${disbursementUnit})`
  const today = moment()
  const nextPayout = disbursements.find(d => moment(d).isAfter(today, 'day'))
    .toDateString()
  const displayAmount = `${amount} ${amountToken}`
  return [ description, DIVIDEND, frequency, nextPayout, displayAmount ]
}

const renderOneTimeMerit = (reward) => {
  const {
    description,
    amount,
    amountToken,
    dateEnd,
  } = reward
  const nextPayout = moment(dateEnd).add(1, 'day').toDate().toDateString()
  const displayAmount = `${amount} ${amountToken}`
  return [ description, MERIT, ONE_TIME, nextPayout, displayAmount ]
}

Overview.propTypes = {
  rewards: PropTypes.arrayOf(PropTypes.object).isRequired,
  newReward: PropTypes.func.isRequired,
  viewReward: PropTypes.func.isRequired,
  metrics: PropTypes.arrayOf(PropTypes.object).isRequired,
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
export default Overview
