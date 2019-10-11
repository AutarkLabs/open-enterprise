import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import addDays from 'date-fns/addDays'
import endOfDay from 'date-fns/endOfDay'
import isAfter from 'date-fns/isAfter'
import {
  ContextMenu,
  ContextMenuItem,
  DataView,
  IconCoin,
  IconView,
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
  viewReward,
  claimReward,
}) => {
  const rewardsEmpty = myRewards.length === 0

  if (rewardsEmpty) {
    return <Empty noButton />
  }

  const renderMenu = (reward) => (
    <ContextMenu>
      <StyledContextMenuItem
        onClick={() => viewReward(reward)}
      >
        <IconView css={{
          marginRight: '11px',
          marginBottom: '2px',
        }}/>
        View
      </StyledContextMenuItem>
      <StyledContextMenuItem
        onClick={() => claimReward(reward)}
      >
        <IconCoin css={{
          marginRight: '11px',
          marginBottom: '2px',
        }}/>
        Claim
      </StyledContextMenuItem>
    </ContextMenu>
  )

  return (
    <OverviewMain>
      <RewardsWrap>
        <Metrics content={myMetrics} />
        <DataView
          heading={<Text size="xlarge">My rewards dashboard</Text>}
          fields={[ 'description', 'disbursement date', 'status', 'amount' ]}
          entries={myRewards}
          renderEntry={renderReward}
          renderEntryActions={renderMenu}
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
    dateReference,
  } = reward
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{amount} {amountToken}
    </Text>
  )
  const disbursementDate = dateReference.toDateString()
  const status = 'Ready to claim'
  return [ description, disbursementDate, status, displayAmount ]
}

const renderRecurringDividend = (reward) => {
  const theme = useTheme()
  const {
    description,
    amount,
    amountToken,
    endDate
  } = reward
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{amount} {amountToken}
    </Text>
  )
  const disbursementDate = (new Date(endDate)).toDateString()
  const status = 'Ready to claim'
  return [ description, disbursementDate, status, displayAmount ]
}

const renderOneTimeMerit = (reward) => {
  const theme = useTheme()
  const {
    description,
    amount,
    amountToken,
    endDate,
  } = reward
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{amount} {amountToken}
    </Text>
  )
  const disbursementDate = (new Date(endDate)).toDateString()
  console.log(disbursementDate)
  const status = 'Ready to claim'
  return [ description, disbursementDate, status, displayAmount ]
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
const StyledContextMenuItem = styled(ContextMenuItem)`
  padding: 8px 45px 8px 19px;
`

// eslint-disable-next-line import/no-unused-modules
export default MyRewards
