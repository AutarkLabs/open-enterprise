import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { BigNumber } from 'bignumber.js'
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  Text,
  Button,
  IdentityBadge,
  Viewport,
  theme,
  IconCheck,
  IconCross,
  IconFundraising,
  IconTime,
  ContextMenu,
  ContextMenuItem,
} from '@aragon/ui'
import { displayCurrency } from '../../utils/helpers'
import {
  AverageRewards,
  AverageRewardsTable,
  formatAvgAmount,
  RewardDescription,
  RewardsTable,
  NarrowList,
  NarrowListReward,
  AmountBadge,
} from './RewardsTables'
import { Empty } from '../Card'
import { provideNetwork } from '../../../../../shared/ui'
import { MILLISECONDS_IN_A_SECOND } from '../../../../../shared/ui/utils'

const averageRewardsTitles = [ 'My Unclaimed Rewards', 'Year to Date', 'Inception to Date' ]

const calculateMyRewardsSummary = (rewards, balances, convertRates) => {
  if (balances && convertRates) {
    return [
      formatAvgAmount(calculateUnclaimedRewards(rewards, balances, convertRates),'+$', 'green'),
      formatAvgAmount(calculateAllRewards(rewards, balances, convertRates), '$'),
      formatAvgAmount(calculateYTDUserRewards(rewards, balances, convertRates), '$'),
    ]
  }
  else {
    return Array(3).fill(formatAvgAmount(0, '$'))
  }
}

const calculateUnclaimedRewards = (rewards, balances, convertRates) => {
  return sumUserRewards(
    rewards,
    balances,
    convertRates,
    (rew, bal) => !rew.claimed && rew.rewardToken === bal.address // rewardFilter
  )
}

const calculateAllRewards = (rewards, balances, convertRates) => {
  return sumUserRewards(
    rewards,
    balances,
    convertRates,
    (rew, bal) => rew.claimed && rew.rewardToken === bal.address, // RewardFilter
  )
}

const calculateYTDUserRewards = (rewards, balances, convertRates) => {
  const yearBeginning = new Date(new Date(Date.now()).getFullYear(), 0)
  return sumUserRewards(
    rewards,
    balances,
    convertRates,
    (rew, bal) => rew.claimed && rew.rewardToken === bal.address && rew.endDate >= yearBeginning
  )
}

const sumUserRewards = (rewards, balances, convertRates, rewardFilter) => {
  return balances.reduce((balAcc, balance) => {
    if (convertRates[balance.symbol]) {
      return rewards.reduce((rewAcc,reward) => {
        return (rewardFilter(reward, balance))
          ?
          BigNumber(reward.userRewardAmount).div(Math.pow(10, balance.decimals)).div(convertRates[balance.symbol]).plus(rewAcc)
            .toNumber()
          :
          rewAcc
      },0) + balAcc
    }
    else return balAcc
  },0)
}

const generateOnClaimReward = (onClaimReward, reward) => (e) => {
  onClaimReward(reward)
  e.stopPropagation()
}

const rewardVisible = reward => reward.startDate < Date.now() && Number(reward.userRewardAmount) !== '0'

const claimedRewards = rewards => rewards.filter(reward => reward.claimed)
const unclaimedRewards = rewards => rewards.filter(reward => !reward.claimed && rewardVisible(reward))

const generateOpenDetails = (reward, openDetails) => () => {
  openDetails(reward)
}

const shortTransaction = transactionID =>
  transactionID.substring(0,4) + '..' + transactionID.substring(transactionID.length - 4)


const getSymbol = (tokens, reward) => {
  return tokens
    .reduce((symbol, token) => {
      if (token.address === reward.rewardToken) return token.symbol
      else return symbol
    },'')
}
const MyRewardsWide = ({ onClaimReward, claimed, rewards, openDetails, network, tokens }) => (
  <Table
    style={{ width: '100%' }}
    header={
      <TableRow>
        <TableHeader key="1" title="Description" />
        <TableHeader key="2" title={!claimed ? 'Status': 'Transaction Date'} />
        <TableHeader key="3" title="Amount" />
      </TableRow>
    }
  >
    {rewards.map((reward, i) => (
      <ClickableTableRow key={i} onClick={generateOpenDetails(reward, openDetails)}>
        <TableCell>
          <RewardDescription>
            {reward.description}
          </RewardDescription>
        </TableCell>
        <TableCell>
          {!reward.claimed ? (
            reward.endDate < Date.now() ? (
              <Button mode="outline" onClick={generateOnClaimReward(onClaimReward, reward)}>
                <IconFundraising color={theme.positive} />

                <Text size="normal" weight="bold">Claim</Text>
              </Button>) : showStatus(reward)
          ) : Intl.DateTimeFormat().format(reward.timeClaimed * MILLISECONDS_IN_A_SECOND)}
        </TableCell>
        <TableCell>
          <AmountBadge>
            {displayCurrency(reward.userRewardAmount)}{' '}{getSymbol(tokens, reward)}
          </AmountBadge>
        </TableCell>
      </ClickableTableRow>
    ))}
  </Table>
)

const RewardStatus = ({ color, icon, title, posTop = 0 }) => {
  const Icon = icon
  return (
    <MyRewardStatus color={color}>
      <Icon style={{ position: 'relative', top: posTop, marginRight: '10px' }} />
      {title}
    </MyRewardStatus>
  )
}

const showStatus = (reward) => {
  let status = 0
  if (reward.endDate < Date.now()) {
    if (!reward.claimed) {
      status = 1
    }
    else {
      status = 2
    }
  }
  switch(status) {
  case 0: return <RewardStatus title="Pending..." icon={IconTime} color={theme.textSecondary} posTop={1} />
  case 1: return <RewardStatus title="Ready to claim" icon={IconFundraising} color="#F5A623" posTop={7} />
  case 2: return <RewardStatus title="Claimed" icon={IconCheck} color={theme.positive} />
  case 3: return <RewardStatus title="Rejected" icon={IconCross} color={theme.negative} />
  }
}

const MyRewardStatus = styled(Text.Block).attrs({
  size: 'small'
})`
  margin-top: 5px;
`
const MyRewardsNarrow = ({ claimed, rewards, openDetails, network, tokens }) => (
  <NarrowList>
    {rewards.map((reward, i) => (
      <NarrowListReward onClick={generateOpenDetails(reward, openDetails)} key={i}>
        <div style={{ marginTop: '5px', marginRight: '10px' }}>
          <RewardDescription>
            {reward.description}
          </RewardDescription>
          <Text.Block size="small" color={theme.textTertiary} style={{ marginTop: '5px' }}>
            {showStatus(reward)}
          </Text.Block>
        </div>
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center' }}>
          <div style={{ marginRight: '10px' }}>
            <AmountBadge>
              {displayCurrency(reward.userRewardAmount)}{' '}{getSymbol(tokens,reward)}
            </AmountBadge>
          </div>
          <div>
            <ContextMenu>
            </ContextMenu>
          </div>
        </div>
      </NarrowListReward>
    ))}
  </NarrowList>
)

const MyRewards = ({ onClaimReward, rewards, newReward, openDetails, network, tokens, convertRates }) => {

  const myRewards = rewards.filter(reward => reward.userRewardAmount > 0)
  const unclaimedRewardsLength = unclaimedRewards(myRewards).length
  const claimedRewardsLength = claimedRewards(myRewards).length

  const myRewardsEmpty = myRewards.length === 0 || (
    claimedRewards(myRewards).length === 0 && unclaimedRewards(myRewards).length === 0
  )

  if (myRewardsEmpty) {
    return <Empty tab='MyRewards' action={newReward} />
  }

  const summarizedRewards = calculateMyRewardsSummary(myRewards, tokens, convertRates)

  return (
    <Main>
      <RewardsWrap>
        {(tokens && convertRates)
          ?
          <AverageRewards
            titles={averageRewardsTitles}
            numbers={summarizedRewards}
          />
          :
          <AverageRewardsTable>
            <Text.Block size="large" weight="bold">
              Calculating summaries...
            </Text.Block>
          </AverageRewardsTable>
        }

        {claimedRewardsLength > 0
        &&
        <RewardsTable
          title="Claimed Rewards"
          claimed={true}
          rewards={claimedRewards(myRewards)}
          openDetails={openDetails}
          network={network}
	        tokens={tokens}
          belowMedium={MyRewardsNarrow}
          aboveMedium={MyRewardsWide}
        />}
        {unclaimedRewardsLength > 0
        &&
        <RewardsTable
          title="Unclaimed Rewards"
          claimed={false}
          rewards={unclaimedRewards(myRewards)}
          openDetails={openDetails}
          network={network}
	        tokens={tokens}
          belowMedium={MyRewardsNarrow}
          aboveMedium={MyRewardsWide}
          onClaimReward={onClaimReward}
        />}
      </RewardsWrap>
    </Main>
  )
}

MyRewards.propTypes = {
  newReward: PropTypes.func.isRequired,
  rewards: PropTypes.arrayOf(PropTypes.object).isRequired,
  network: PropTypes.object,
  tokens: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const Main = styled.div`
  background-color: #F8FCFD;
`
const RewardsWrap = styled.div`
  flex-grow: 1;
  /*background: #1DD9D5;*/
  > :not(:last-child) {
    margin-bottom: 20px;
  }
`
const ClickableTableRow = styled(TableRow)`
  :hover {
    cursor: pointer;
  }
`
const ClaimButtonText = styled(Text.Block).attrs({
  size: 'small'
})`
  margin: 0px;
`

export default provideNetwork(MyRewards)
