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

import { AverageRewards, formatAvgAmount } from './RewardsTables'
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

const dot = <span style={{ margin: '0px 6px' }}>&middot;</span>

const averageRewardsTitles = [ 'Average Reward', 'Monthly Average', 'Total this year' ]
// TODO: these need to be actually calculated
const averageRewardsNumbers = [
  formatAvgAmount(146, '$'),
  formatAvgAmount(19989.88, '$'),
  formatAvgAmount(799.87, '$'),
]

const generateOpenDetails = (reward, openDetails) => () => {
  console.log('calling openDetails on', reward)
  openDetails(reward)
}

const RewardsTableNarrow = ({ title, data, fourthColumn, fourthColumnData, openDetails }) => (
  <NarrowList>
    {data.map((reward, i) => (
      <NarrowListReward onClick={generateOpenDetails(reward, openDetails)} key={i}>
        <div style={{ marginTop: '5px', marginRight: '10px' }}>
          <RewardDescription>
            {reward.description}
          </RewardDescription>
          <Text.Block size="small" color={theme.textTertiary} style={{ marginTop: '5px' }}>
            {reward.isMerit ? 'Merit' : 'Dividend'}
            {dot}
            Monthly
            {dot}
            {fourthColumnData(reward)}
          </Text.Block>
        </div>
        <div>
          <AmountBadge>
            {displayCurrency(reward.amount)}{' '}{translateToken(reward.rewardToken)}
          </AmountBadge>
        </div>
      </NarrowListReward>
    ))}
  </NarrowList>
)

const RewardsTableWide = ({ title, data, fourthColumn, fourthColumnData, openDetails }) => (
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
    {data.map((reward, i) => (
      <ClickableTableRow key={i} onClick={generateOpenDetails(reward, openDetails)}>
        <TableCell>
          <RewardDescription>
            {reward.description}
          </RewardDescription>
        </TableCell>
        <TableCell>
          {reward.isMerit ? 'Merit' : 'Dividend'}
        </TableCell>
        <TableCell>
          Monthly
        </TableCell>
        <TableCell>
          {fourthColumnData(reward)}
        </TableCell>
        <TableCell>{displayCurrency(reward.amount)}{' '}{translateToken(reward.rewardToken)}</TableCell>
      </ClickableTableRow>
    ))}
  </Table>
)

const RewardsTable = props => (
  <div>
    <Text.Block size="large" weight="bold">
      {props.title} Rewards
    </Text.Block>

    <Viewport>
      {({ below }) => 
        below('medium') ? (
          <RewardsTableNarrow {...props} />
        ) : (
          <RewardsTableWide {...props} />
        )
      }
    </Viewport>
  </div>
)

/*
const leadersList = leaders => (
  <LeadersLlist>
    {leaders.sort((l1, l2) => l1.amount < l2.amount ? 1 : -1).map(leader => (
      <li><span>{leader.name}</span><span style={{ fontWeight: 'bold' }}>$ {leader.amount}</span></li>
    ))}
  </LeadersLlist>
)
*/

// TODO: apply logic
const displayNextPayout = reward => '-' + reward.date + '-'
const displayStatus = reward => 'Pending'
const displayLastPayout = reward => '-' + reward.date + '-'

const tableType = [
  { title: 'Current', fourthColumn: 'Next Payout', fourthColumnData: displayNextPayout },
  { title: 'Pending', fourthColumn: 'Status', fourthColumnData: displayStatus },
  { title: 'Past', fourthColumn: 'Last Payout', fourthColumnData: displayLastPayout },
]

const Overview = ({ rewards, newReward, openDetails }) => {
  const rewardsEmpty = rewards.length === 0
  
  if (rewardsEmpty) {
    return <Empty tab='Overview' action={newReward} />
  }

  return (
    <OverviewMain>
      <RewardsWrap>
        <AverageRewards
          titles={averageRewardsTitles}
          numbers={averageRewardsNumbers}
        />

        {tableType.map(({ title, fourthColumn, fourthColumnData }) => (
          <RewardsTable
            key={title}
            title={title}
            fourthColumn={fourthColumn}
            fourthColumnData={fourthColumnData}
            data={rewards}
            openDetails={openDetails}
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
const NarrowList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
  > :not(:last-child) {
    border-bottom: 1px solid ${theme.contentBorder};
  }
`
const NarrowListReward = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 10px;
`
const AmountBadge = styled(Badge).attrs({
  background: '#D1D1D1',
  foreground: theme.textPrimary,
})`
  padding: 10px;
  margin: 20px
  text-size: large;
`
const RewardDescription = styled(Text.Block)`
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${theme.textPrimary};
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
