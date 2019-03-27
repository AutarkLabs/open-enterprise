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

const MyRewardsWide = ({ claimed, dat, openDetails, network, tokens }) => (
  <Table
    style={{ width: '100%' }}
    header={
      <TableRow>
        <TableHeader key="1" title="Description" />
        <TableHeader key="2" title="Transaction" />
        <TableHeader key="3" title={claimed ? 'Status': 'Transaction Date'} />
        <TableHeader key="4" title="Amount" />
      </TableRow>
    }
  >
    {data.map((reward, i) => (
      <ClickableTableRow key={i} onClick={generateOpenDetails(reward, openDetails)}>
        <TableCell>
          <RewardDescription>
            {reward.description}
          </RewardDescription>
        </TableCell>
        <TableCell>
          {reward.transactionID}
        </TableCell>
        <TableCell>
          {claimed ? (<Button>Claim</Button>) : '10/11/12'}
        </TableCell>
        <TableCell>{displayCurrency(reward.amount)}{' '}{tokens[reward.rewardToken]}</TableCell>
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

const showStatus = (status = 3) => {
  switch(status) {
  case 0: return <RewardStatus title="Claim in progress..." icon={IconTime} color={theme.textSecondary} posTop={1} />
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
const MyRewardsNarrow = ({ claimed, data, openDetails, network, tokens }) => (
  <NarrowList>
    {data.map((reward, i) => (
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
              {displayCurrency(reward.amount)}{' '}{tokens[reward.rewardToken]}
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
  const rewardsEmpty = rewards.length === 0

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

        <RewardsTable
          title="Claimed Rewards"
          claimed={true}
          data={rewards}
          openDetails={openDetails}
          network={network}
	  tokens={tokens}
          belowMedium={MyRewardsNarrow}
          aboveMedium={MyRewardsWide}
        />
        <RewardsTable
          title="Unclaimed Rewards"
          claimed={false}
          data={rewards}
          openDetails={openDetails}
          network={network}
	  tokens={tokens}
          belowMedium={MyRewardsNarrow}
          aboveMedium={MyRewardsWide}
        />
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

export default provideNetwork(MyRewards)

