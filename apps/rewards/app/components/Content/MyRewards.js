import PropTypes from 'prop-types'
import React, { useState } from 'react'
import styled from 'styled-components'
import {
  ContextMenu,
  ContextMenuItem,
  DataView,
  GU,
  IconCoin,
  IconHash,
  IconView,
  Text,
  useTheme,
} from '@aragon/ui'
import {
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT,
  READY,
  CLAIMED,
} from '../../utils/constants'
import { Empty } from '../Card'
import Metrics from './Metrics'
import { useAppState, useAragonApi, useNetwork } from '@aragon/api-react'
import BigNumber from 'bignumber.js'
import { displayCurrency, getStatus, getStatusId } from '../../utils/helpers'

const MyRewards = ({
  myRewards,
  myMetrics,
  viewReward,
  claimReward,
  claimHashes,
}) => {
  const network = useNetwork()
  const rewardsEmpty = myRewards.length === 0
  const { api } = useAragonApi()
  const [ user, setUser ] = useState()
  api.accounts().subscribe(accounts => setUser(accounts[0]))

  const getEtherscanLink = reward => {
    const networkChunk = network.id === 1 ? '' : `${network.type}.`
    const claimHash = claimHashes[reward.rewardId][user]
    const link = `https://${networkChunk}etherscan.io/tx/${claimHash}`
    return link
  }

  if (rewardsEmpty) {
    return <Empty noButton />
  }

  const renderMenu = (reward) => {
    const statusId = getStatusId(reward)
    return (
      <ContextMenu>
        <StyledContextMenuItem onClick={() => viewReward(reward)} >
          <StyledIcon Icon={IconView} />
          View reward
        </StyledContextMenuItem>
        {statusId === READY && (
          <StyledContextMenuItem onClick={() => claimReward(reward)} >
            <StyledIcon Icon={IconCoin} />
            Claim
          </StyledContextMenuItem>
        )}
        {statusId === CLAIMED && (
          <StyledContextMenuItem href={getEtherscanLink(reward)}>
            <StyledIcon Icon={IconHash} />
            View on Etherscan
          </StyledContextMenuItem>
        )}
      </ContextMenu>
    )
  }

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
  const { description, userRewardAmount, amountToken, dateReference } = reward
  const decimals = amountTokens.find(t => t.symbol === amountToken).decimals
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{displayCurrency(BigNumber(userRewardAmount), decimals)} {amountToken}
    </Text>
  )
  const disbursementDate = dateReference.toDateString()
  const status = getStatus(reward)
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
  const status = getStatus(reward)
  return [ description, disbursementDate, status, displayAmount ]
}

const renderOneTimeMerit = (reward, amountTokens) => {
  const theme = useTheme()
  const { description, userRewardAmount, amountToken, endDate } = reward
  const decimals = amountTokens.find(t => t.symbol === amountToken).decimals
  const displayAmount = (
    <Text color={String(theme.positive)}>
      +{displayCurrency(BigNumber(userRewardAmount), decimals)} {amountToken}
    </Text>
  )
  const disbursementDate = (new Date(endDate)).toDateString()
  const status = getStatus(reward)
  return [ description, disbursementDate, status, displayAmount ]
}

MyRewards.propTypes = {
  myRewards: PropTypes.arrayOf(PropTypes.object).isRequired,
  myMetrics: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const StyledIcon = ({ Icon }) => (
  <Icon style={{
    marginRight: GU * 1.5 + 'px',
    marginBottom: GU / 4 + 'px',
  }}/>
)

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
