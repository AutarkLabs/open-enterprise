import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { BigNumber } from 'bignumber.js'
import moment from 'moment'
import { DataView, Text } from '@aragon/ui'
import {
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT,
  RECURRING,
  ONE_TIME,
  MERIT,
  DIVIDEND
} from '../../utils/constants'
import {
  AverageRewards,
  AverageRewardsTable,
  formatAvgAmount,
} from './RewardsTables'
import { MILLISECONDS_IN_A_MONTH, } from '../../../../../shared/ui/utils'
import { Empty } from '../Card'

const averageRewardsTitles = [ 'Average Reward', 'Monthly Average', 'Total this year' ]
// TODO: these need to be actually calculated
const calculateAverageRewardsNumbers = ( rewards, claims, balances, convertRates ) => {
  if (Object.keys(claims).length > 0 && balances && convertRates) {
    return [
      formatAvgAmount(calculateAvgClaim(claims, balances, convertRates), '$'),
      formatAvgAmount(calculateMonthlyAvg(rewards, balances, convertRates), '$'),
      formatAvgAmount(calculateYTDRewards(rewards,balances, convertRates), '$'),
    ]
  }
  else {
    return Array(3).fill(formatAvgAmount(0, '$'))
  }
}

const calculateAvgClaim = ({ claimsByToken, totalClaimsMade }, balances, convertRates) => {
  return sumTotalRewards(
    claimsByToken,
    balances,
    convertRates,
    (claim, bal) => claim.address === bal.address
  ) / totalClaimsMade
}

const calculateMonthlyAvg = (rewards, balances, convertRates) => {
  let monthCount = Math.ceil((Date.now() - rewards.reduce((minDate, reward) => {
    return reward.endDate < minDate.endDate ? reward: minDate
  }).endDate) / MILLISECONDS_IN_A_MONTH)

  return sumTotalRewards(
    rewards,
    balances,
    convertRates,
    (rew, bal) => rew.rewardToken === bal.address
  ) / monthCount
}

const calculateYTDRewards = (rewards, balances, convertRates) => {
  const yearBeginning = new Date(new Date(Date.now()).getFullYear(), 0)
  return sumTotalRewards(
    rewards,
    balances,
    convertRates,
    (rew, bal) => rew.rewardToken === bal.address && rew.endDate >= yearBeginning
  )
}

const sumTotalRewards = (rewards, balances, convertRates, rewardFilter) => {
  return balances.reduce((balAcc, balance) => {
    if (convertRates[balance.symbol]) {
      return rewards.reduce((rewAcc,reward) => {
        return (rewardFilter(reward, balance))
          ?
          BigNumber(reward.amount).div(Math.pow(10, balance.decimals)).div(convertRates[balance.symbol]).plus(rewAcc)
            .toNumber()
          :
          rewAcc
      },0) + balAcc
    }
    else return balAcc
  },0)
}

const Overview = ({ tokens, rewards, convertRates, claims, newReward }) => {
  const rewardsEmpty = rewards.length === 0

  if (rewardsEmpty) {
    return <Empty tab='Overview' action={newReward} />
  }
  const averageRewardsNumbers = calculateAverageRewardsNumbers(rewards, claims, tokens, convertRates)
  return (
    <OverviewMain>
      <RewardsWrap>

        {(tokens && convertRates)
          ?
          <AverageRewards
            titles={averageRewardsTitles}
            numbers={averageRewardsNumbers}
          />
          :
          <AverageRewardsTable>
            <Text.Block size="large" weight="bold">
              Calculating summaries...
            </Text.Block>
          </AverageRewardsTable>
        }

        <DataView
          heading="Current rewards"
          fields={[ 'description', 'type', 'frequency', 'next payout', 'amount' ]}
          entries={rewards}
          renderEntry={(reward) => {
            switch(reward.rewardType) {
            case ONE_TIME_DIVIDEND:
              return renderOneTimeDividend(reward)
            case RECURRING_DIVIDEND:
              return renderRecurringDividend(reward)
            case ONE_TIME_MERIT:
              return renderOneTimeMerit(reward)
            }
          }}
        />
      </RewardsWrap>
    </OverviewMain>
  )
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
  tokens: PropTypes.arrayOf(PropTypes.object).isRequired,
  newReward: PropTypes.func.isRequired,
  rewards: PropTypes.arrayOf(PropTypes.object).isRequired,
  convertRates: PropTypes.object,
  claims: PropTypes.object.isRequired,
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
