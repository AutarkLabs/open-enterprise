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
  formatAvgAmount,
  RewardDescription,
  RewardsTable,
  NarrowList,
  NarrowListReward,
  AmountBadge,
} from './RewardsTables'
import { Empty } from '../Card'
import { provideNetwork } from '../../../../../shared/ui'

const averageRewardsTitles = [ 'My Unclaimed Rewards', 'Year to Date', 'Inception to Date' ]
// TODO: these need to be actually calculated
const averageRewardsNumbers = [
  formatAvgAmount(146, '+$', 'green'),
  formatAvgAmount(19989.88, '$'),
  formatAvgAmount(799.87, '$'),
]

const rewardVisible = reward => reward.endDate < Date.now() && Number(reward.userRewardAmount) !== '0'

const claimedRewards = rewards => rewards.filter(reward => reward.claimed)
const unclaimedRewards = rewards => rewards.filter(reward => !reward.claimed && rewardVisible(reward))

const generateOpenDetails = (reward, openDetails) => () => {
  console.log('calling openDetails on', reward)
  openDetails(reward)
}

const shortTransaction = transactionID =>
  transactionID.substring(0,4) + '..' + transactionID.substring(transactionID.length - 4)

const mockReward = [{
  creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  isMerit: true,
  referenceToken: 'SDN',
  rewardToken: 0x0,
  amount: BigNumber(17e18),
  transactionID: '0xb4124cEB3451635DAcedd11767f004',
  startDate: new Date('2018-12-17'),
  endDate: new Date('2019-01-17'),
  description: 'Q1 Reward for Space Decentral Contributors',
  delay: 0,
  index: 0,
  claimed: true,
}]


const getSymbol = (tokens, reward) => {
  return tokens
    .reduce((symbol, token) => {
      if (token.address === reward.rewardToken) return token.symbol
      else return symbol
    },'')
}
const MyRewardsWide = ({ claimed, rewards, openDetails, network, tokens }) => (
  <Table
    style={{ width: '100%' }}
    header={
      <TableRow>
        <TableHeader key="1" title="Description" />
        {/*<TableHeader key="2" title="Transaction" />*/}
        <TableHeader key="3" title={!claimed ? 'Status': 'Transaction Date'} />
        <TableHeader key="4" title="Amount" />
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
        {/*<TableCell>
          {reward.transactionID}
        </TableCell>*/}
        <TableCell>
          {!reward.claimed ? (
            <Button mode="outline" >
              <IconFundraising color={theme.positive} style={{ 'padding-top': '10px', 'padding-bottom': '5px' }} />

              <Text size="normal" weight="bold">Claim</Text>
            </Button>) : Intl.DateTimeFormat().format(reward.timeClaimed)}
        </TableCell>
        <TableCell>
          <AmountBadge style={{ margin: '0px', padding: '5px', paddingRight: '10px', paddingLeft: '10px', }}>
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

const showStatus = (status = 1) => {
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
            {showStatus(reward.status)}
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

const MyRewards = ({ rewards, newReward, openDetails, network, tokens }) => {
  const rewardsEmpty = rewards.length === 0 || (
    claimedRewards(rewards).length === 0 && unclaimedRewards(rewards).length === 0
  )

  if (rewardsEmpty) {
    return <Empty tab='MyRewards' action={newReward} />
  }

  return (
    <Main>
      <RewardsWrap>
        <AverageRewards
          titles={averageRewardsTitles}
          numbers={averageRewardsNumbers}
        />

        {claimedRewards(rewards).length > 0
        &&
        <RewardsTable
          title="Claimed Rewards"
          claimed={true}
          rewards={rewards.filter(reward => reward.claimed)}
          openDetails={openDetails}
          network={network}
	        tokens={tokens}
          belowMedium={MyRewardsNarrow}
          aboveMedium={MyRewardsWide}
        />}
        {unclaimedRewards(rewards).length > 0
        &&
        <RewardsTable
          title="Unclaimed Rewards"
          claimed={false}
          rewards={unclaimedRewards(rewards)}
          openDetails={openDetails}
          network={network}
	        tokens={tokens}
          belowMedium={MyRewardsNarrow}
          aboveMedium={MyRewardsWide}
        />}
      </RewardsWrap>
    </Main>
  )
}

MyRewards.propTypes = {
  newReward: PropTypes.func.isRequired,
  rewards: PropTypes.arrayOf(PropTypes.object).isRequired,
  network: PropTypes.object,
  tokens: PropTypes.object,
}

const Main = styled.div`
  padding: 10px;
  background-color: #F8FCFD;
`
const RewardsWrap = styled.div`
  flex-grow: 1;
  padding: 10px;
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
