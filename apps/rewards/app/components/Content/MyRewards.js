import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import {
  ContextMenu,
  ContextMenuItem,
  DataView,
  GU,
  IconCheck,
  IconCircleCheck,
  IconClock,
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
import { useAppState } from '@aragon/api-react'
import BigNumber from 'bignumber.js'
import { displayCurrency } from '../../utils/helpers'

const types = {
  claimed: { icon: IconCircleCheck, text: 'Claimed', color: 'positive' },
  ready: { icon: IconCheck, text: 'Ready to claim', color: 'positive' },
  pending: { icon: IconClock, text: 'Pending', color: 'warning' },
}

const Status = ({ type }) => {
  const theme = useTheme()
  const status = types[type]
  const text = status.text
  const Icon = status.icon
  const color = theme[status.color]
  return (
    <div css='display: flex;'>
      <Icon style={{
        marginRight: 0.5 * GU + 'px',
        marginTop: -0.25 * GU + 'px',
        color: color,
      }} />
      <Text>
        {text}
      </Text>
    </div>
  )
}

Status.propTypes = {
  type: PropTypes.oneOf(Object.keys(types)).isRequired,
}

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
      {(reward.claims < reward.disbursements.length && (reward.disbursements[reward.claims] < Date.now())) && (
        <StyledContextMenuItem
          onClick={() => claimReward(reward)}
        >
          <IconCoin css={{
            marginRight: '11px',
            marginBottom: '2px',
          }}/>
        Claim
        </StyledContextMenuItem>)}
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
  const { amountTokens } = useAppState()
  switch(reward.rewardType) {
  case ONE_TIME_DIVIDEND:
    fields = renderOneTimeDividend(reward, amountTokens)
    break
  case RECURRING_DIVIDEND:
    fields = renderRecurringDividend(reward, amountTokens)
    break
  case ONE_TIME_MERIT:
    fields = renderOneTimeMerit(reward, amountTokens)
    break
  }
  return fields
}

const renderOneTimeDividend = (reward, amountTokens) => {
  const theme = useTheme()
  const {
    description,
    userRewardAmount,
    amountToken,
    dateReference,
    timeClaimed,
    endDate
  } = reward
  const decimals = amountTokens.find(t => t.symbol === amountToken).decimals
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{displayCurrency(BigNumber(userRewardAmount), decimals)} {amountToken}
    </Text>
  )
  const disbursementDate = dateReference.toDateString()
  const status = timeClaimed > 0 ? <Status type="claimed" /> : (
    Date.now() > endDate ? <Status type="ready" /> : <Status type="pending" />
  )
  return [ description, disbursementDate, status, displayAmount ]
}

const renderRecurringDividend = (reward, amountTokens) => {
  const theme = useTheme()
  const {
    description,
    userRewardAmount,
    amountToken,
    claims,
    disbursements
  } = reward
  const decimals = amountTokens.find(t => t.symbol === amountToken).decimals
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{displayCurrency(BigNumber(userRewardAmount), decimals)} {amountToken}
    </Text>
  )
  const disbursementDate = (disbursements[claims] || disbursements[claims-1]).toDateString()
  const status = claims === disbursements.length ? <Status type="claimed" /> : (
    Date.now() > disbursements[claims].getTime() ? <Status type="ready" /> :
      <Status type="pending" />
  )
  return [ description, disbursementDate, status, displayAmount ]
}

const renderOneTimeMerit = (reward, amountTokens) => {
  const theme = useTheme()
  const {
    description,
    userRewardAmount,
    amountToken,
    endDate,
    timeClaimed
  } = reward
  const decimals = amountTokens.find(t => t.symbol === amountToken).decimals
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{displayCurrency(BigNumber(userRewardAmount), decimals)} {amountToken}
    </Text>
  )
  const disbursementDate = (new Date(endDate)).toDateString()
  const status = timeClaimed > 0 ? <Status type="claimed" /> : (
    Date.now() > endDate ? <Status type="ready" /> : <Status type="pending" />
  )
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
