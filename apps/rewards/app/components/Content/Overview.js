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
  Viewport,
  theme,
  Badge,
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
import { MILLISECONDS_IN_A_MONTH } from '../../../../../shared/ui/utils'
import { Empty } from '../Card'

const fourthColumns = [ 'Next Payout', 'Status', 'Last Payout' ]
const headersNames = fourth => [
  'Description',
  'Type',
  'Cycle',
  fourth,
  'Amount',
]

const translateToken = (token) => {
  if (token == 0x0) {
    return 'ETH'
  }
}

const getSymbol = (tokens, rewardToken) => {
  return tokens
    .reduce((symbol, token) => {
      if (token.address === rewardToken) return token.symbol
      else return symbol
    },'')
}

const dot = <span style={{ margin: '0px 6px' }}>&middot;</span>

const averageRewardsTitles = [ 'Average Reward', 'Monthly Average', 'Total this year' ]
// TODO: these need to be actually calculated
const calculateAverageRewardsNumbers = ( rewards, claims, balances, convertRates ) => {
  if (claims && balances && convertRates) {
    return [
      formatAvgAmount(calculateAvgClaim(claims, balances, convertRates), '$'),
      formatAvgAmount(calculateMonthlyAvg(rewards, balances, convertRates), '$'),
      formatAvgAmount(calculateYTDRewards(rewards,balances, convertRates), '$'),
    ]
  }
}

const calculateAvgClaim = (claims, balances, convertRates) => {
  if (claims && balances && convertRates) {
    return balances.reduce((balAcc, balance) => {
      if (convertRates[balance.symbol]) {
        return claims.claimsByToken.reduce((claimAcc, claim) => {
          return (claim.address === balance.address)
            ?
            claimAcc + claim.amount / Math.pow(10, balance.decimals) / convertRates[balance.symbol]
            :
            claimAcc
        },0) + balAcc
      }
      else return balAcc
    },0) / claims.totalClaimsMade
  }
}

const calculateMonthlyAvg = (rewards, balances, convertRates) => {
  console.log(rewards)
  let monthCount = Math.ceil((Date.now() - rewards.reduce((minDate, reward) => {
    return reward.endDate < minDate.endDate ? reward: minDate
  }).endDate) / MILLISECONDS_IN_A_MONTH)

  return balances.reduce((balAcc, balance) => {
    console.log('balAcc ', balAcc)
    if (convertRates[balance.symbol]) {
      return rewards.reduce((rewAcc,reward) => {
        return (reward.claimed && reward.rewardToken === balance.address)
          ?
          rewAcc + reward.amount / Math.pow(10, balance.decimals) / convertRates[balance.symbol]
          :
          rewAcc
      },0) + balAcc
    }
    else return balAcc
  },0) / monthCount
}

const calculateYTDRewards = (rewards, balances, convertRates) => {
  const yearBeginning = new Date(new Date(Date.now()).getFullYear(), 0)
  return balances.reduce((balAcc, balance) => {
    console.log('balAcc ', balAcc)
    if (convertRates[balance.symbol]) {
      return rewards.reduce((rewAcc,reward) => {
        return (reward.claimed && reward.rewardToken === balance.address && reward.endDate >= yearBeginning)
          ?
          rewAcc + reward.amount / Math.pow(10, balance.decimals) / convertRates[balance.symbol]
          :
          rewAcc
      },0) + balAcc
    }
    else return balAcc
  },0)
}

const generateOpenDetails = (reward, openDetails) => () => {
  openDetails(reward)
}

const RewardsTableNarrow = ({ title, tokens, rewards, fourthColumn, fourthColumnData, openDetails }) => (
  <NarrowList>
    {rewards.map((reward, i) => (
      <NarrowListReward onClick={generateOpenDetails(reward, openDetails)} key={i}>
        <div style={{ marginTop: '5px', marginRight: '10px' }}>
          <RewardDescription>
            {reward.description}
          </RewardDescription>
          <Text.Block size="small" color={theme.textSecondary} style={{ marginTop: '5px' }}>
            {reward.isMerit ? 'Merit' : 'Dividend'}
            {dot}
            {reward.isMerit ? 'One-Time' : 'Monthly'}
            {dot}
            {fourthColumnData(reward)}
          </Text.Block>
        </div>
        <div>
          <AmountBadge>
            {displayCurrency(reward.amount)}{' '}{getSymbol(tokens, reward.rewardToken)}
          </AmountBadge>
        </div>
      </NarrowListReward>
    ))}
  </NarrowList>
)

const RewardsTableWide = ({ title, tokens, rewards, fourthColumn, fourthColumnData, openDetails }) => {
  return (
    <Table
      style={{ width: '100%' }}
      header={
        <TableRow>
          {headersNames(fourthColumn).map(header => (
            <TableHeader key={header} title={header} />
          ))}
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
            {reward.isMerit ? 'Merit Reward' : 'Dividend'}
          </TableCell>
          <TableCell>
            {reward.isMerit ? 'One-Time' : 'Monthly'}
          </TableCell>
          <TableCell>
            {fourthColumnData(reward)}
          </TableCell>
          <TableCell>
            <AmountBadge style={{ margin: '0px', padding: '5px', paddingRight: '10px', paddingLeft: '10px', }}>
              {displayCurrency(reward.amount)}{' '}{getSymbol(tokens, reward.rewardToken)}
            </AmountBadge>
          </TableCell>
        </ClickableTableRow>
      ))}
    </Table>
  )}

/*
const leadersList = leaders => (
  <LeadersLlist>
    {leaders.sort((l1, l2) => l1.amount < l2.amount ? 1 : -1).map(leader => (
      <li><span>{leader.name}</span><span style={{ fontWeight: 'bold' }}>$ {leader.amount}</span></li>
    ))}
  </LeadersLlist>
)
*/

const displayNextPayout = reward => Intl.DateTimeFormat().format(reward.endDate)
const displayStatus = reward => 'Pending'
const displayLastPayout = reward => Intl.DateTimeFormat().format(reward.endDate)
const futureRewards = rewards => rewards.filter(reward => reward.endDate > Date.now())
const pastRewards = rewards => rewards.filter(reward => reward.endDate <= Date.now())

const tableType = [
  { title: 'Current Rewards', fourthColumn: 'Next Payout', fourthColumnData: displayNextPayout, filterRewards: futureRewards },
  // This will be implemented after advanced forwarding is implemented in the Aragon API
  //{ title: 'Pending Rewards', fourthColumn: 'Status', fourthColumnData: displayStatus },
  { title: 'Past Rewards', fourthColumn: 'Last Payout', fourthColumnData: displayLastPayout, filterRewards: pastRewards },
]

const Overview = ({ tokens, rewards, convertRates, claims, newReward, openDetails }) => {
  const rewardsEmpty = rewards.length === 0
  console.log(calculateAvgClaim(claims, tokens, convertRates), claims)
  const averageRewardsNumbers = calculateAverageRewardsNumbers(rewards, claims, tokens, convertRates)

  if (rewardsEmpty) {
    return <Empty tab='Overview' action={newReward} />
  }
  return (
    <OverviewMain>
      <RewardsWrap>

        {(claims && tokens && convertRates)
          ?
          <AverageRewards
            titles={averageRewardsTitles}
            numbers={averageRewardsNumbers}
          />
          :
          'Calculating Summary...'
        }

        {tableType.map(({ title, fourthColumn, fourthColumnData, filterRewards }) => (
          filterRewards(rewards).length > 0
          &&
          <RewardsTable
            key={title}
            title={title}
            fourthColumn={fourthColumn}
            fourthColumnData={fourthColumnData}
            rewards={filterRewards(rewards)}
            tokens={tokens}
            openDetails={openDetails}
            belowMedium={RewardsTableNarrow}
            aboveMedium={RewardsTableWide}
          />
        ))}
      </RewardsWrap>

      {/*<LeaderBoardWrap>
        <FieldTitle
          style={{ borderBottom: '1px solid grey', marginBottom: '10px' }}
        >
          Leaderboard
        </FieldTitle>
        {leadersList(leaders)}
      </LeaderBoardWrap> */}
    </OverviewMain>
  )
}

Overview.propTypes = {
  newReward: PropTypes.func.isRequired,
  openDetails: PropTypes.func.isRequired,
  rewards: PropTypes.arrayOf(PropTypes.object).isRequired,
}

const OverviewMain = styled.div`
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
/*
const LeaderBoardWrap = styled.div`
  ${breakpoint(
    'medium',
    `
    width: 300px;
    `
  )};

  width: 100%;
  background: #8196FF;
  padding: 10px;
`

const LeadersLlist = styled.ul`
  list-style: none;
  li {
    display: flex;
    justify-content: space-between;
  }
`
*/
export default Overview
