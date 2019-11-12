import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import {
  ContextMenu,
  ContextMenuItem,
  DataView,
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

const PendingStatus = (theme) => (
  <div style={{ display: 'flex' }}>
    <IconClock style={{
      marginRight: '4px',
      marginTop: '-2px',
      color: theme.warning,
    }}/>
    Pending
  </div>
)

const ReadyStatus = (theme) => (
  <div style={{ display: 'flex' }}>
    <IconCheck style={{
      marginRight: '4px',
      marginTop: '-2px',
      color: theme.positive,
    }}/>
    Ready to claim
  </div>
)

const ClaimedStatus = (theme) => (
  <div style={{ display: 'flex' }}>
    <IconCircleCheck style={{
      marginRight: '4px',
      marginTop: '-2px',
      color: theme.positive,
    }}/>
    Claimed
  </div>
)

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
  const status = timeClaimed > 0 ? ClaimedStatus(theme) : (
    Date.now() > endDate ? ReadyStatus(theme) : PendingStatus(theme)
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
  const status = claims === disbursements.length ? ClaimedStatus(theme) : (
    Date.now() > disbursements[claims].getTime() ? ReadyStatus(theme) :
      PendingStatus(theme)
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
  const status = timeClaimed > 0 ? ClaimedStatus(theme) : (
    Date.now() > endDate ? ReadyStatus(theme) : PendingStatus(theme)
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
