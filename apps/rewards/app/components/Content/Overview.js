import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import {
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  Text,
  breakpoint,
} from '@aragon/ui'
import { FieldTitle } from '../Form'

import { Empty } from '../Card'

const rw = [
  {
    isMerit: true,
    referenceToken: 'REF',
    rewardToken: 'ETH',
    amount: 0.1,
    endBlock: 0,
    delay: 200,
    rewardAmount: 2.1,
    description: 'Coral',
    date: '10/11/12',
  },
  {
    isMerit: true,
    referenceToken: 'REF',
    rewardToken: 'ETH',
    amount: 10,
    endBlock: 0,
    delay: 400,
    rewardAmount: 0.1,
    description: 'MJ',
    date: '09/11/12',
  },
  {
    isMerit: false,
    referenceToken: 'SCC',
    rewardToken: 'DAI',
    amount: 7.2,
    endBlock: 0,
    delay: 0,
    rewardAmount: 44,
    description: 'desc',
    date: '10/13/12',
  },
  {
    isMerit: true,
    referenceToken: 'REF',
    rewardToken: 'DAI',
    amount: 3.9,
    endBlock: 0,
    delay: 0,
    rewardAmount: 1,
    description: 'Coral',
    date: '32/11/01',
  },
  {
    isMerit: true,
    referenceToken: 'REF',
    rewardToken: 'ETH',
    amount: 100.1,
    endBlock: 0,
    delay: 200,
    rewardAmount: 200,
    description: 'Coral',
    date: '10/11/12',
  },
  {
    isMerit: false,
    referenceToken: 'REF',
    rewardToken: 'ETH',
    amount: 310,
    endBlock: 0,
    delay: 2000,
    rewardAmount: 3.98,
    description: 'SD',
    date: '10/11/12',
  },
]

const headersNames = fourth => [
  'Description',
  'Type',
  'Cycle',
  fourth,
  'Amount',
]

const fourthColumns = [ 'Next Payout', 'Status', 'Last Payout' ]

const ClickArea = styled.div`
  height: 100%;
  left: 0;
  position: absolute;
  width: 100%;
  z-index: 0;
background: yellow;
  :active {
    border: 1px solid ${theme.accent};
    z-index: 3;
  }
  :hover {
    cursor: pointer;
  }
`
//const generateOpenDetails = (reward, openDetails) => () => {
//console.log('calling openDetails on', reward)
//openDetails(reward)
//}

const RewardsTable = ({ title, data, fourthColumn, fourthColumnData, openDetails }) => {
  // const headers = headersNames.splice(3, 0, fourth)
  return (
    <div>
    <Text.Block size="large" weight="bold">
      {title} Rewards
    </Text.Block>
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
<div>
<ClickArea onClick={generateOpenDetails(reward, openDetails)} />
      <TableRow key={i}>
        <TableCell>
          <Text>{reward.description}</Text>
        </TableCell>
        <TableCell>
          {reward.isMerit ? 'Merit' : 'Dividend'}
        </TableCell>
        <TableCell>Monthly</TableCell>
        <TableCell>
          {fourthColumnData(reward)}
        </TableCell>
        <TableCell>{reward.rewardAmount}</TableCell>
      </TableRow>
</div>
    ))}
    </Table>
    </div>
  )
}

/*
const leadersList = leaders => (
  <LeadersLlist>
    {leaders.sort((l1, l2) => l1.amount < l2.amount ? 1 : -1).map(leader => (
      <li><span>{leader.name}</span><span style={{ fontWeight: 'bold' }}>$ {leader.amount}</span></li>
    ))}
  </LeadersLlist>
)
*/

const averageAmount = amount => {
  const formatted = amount.toLocaleString().split('.')
  return formatted[1] ? (
    <Text.Block size="xlarge" weight="bold">
      ${formatted[0]}.
      <Text size="large" weight="bold">
        {formatted[1]}
      </Text>
    </Text.Block>
  ) : (
    <Text.Block size="xlarge" weight="bold">
      ${formatted[0]}
    </Text.Block>
  )
}

const averageRewards = (avg, avgM, total) => (
  <AverageRewards>
    <AverageItem>
      <FieldTitle>AVERAGE Reward</FieldTitle>
      {averageAmount(avg)}
    </AverageItem>
    <AverageItem>
      <FieldTitle>Monthly Average</FieldTitle>
      {averageAmount(avgM)}
    </AverageItem>
    <AverageItem>
      <FieldTitle>Total this year</FieldTitle>
      {averageAmount(total)}
    </AverageItem>
  </AverageRewards>
)

// TODO: apply logic
const displayNextPayout = reward => '-' + reward.date + '-'
const displayStatus = reward => 'Pending'
const displayLastPayout = reward => '-' + reward.date + '-'

const tableType = [
  { title: 'Current', fourthColumn: 'Next Payout', data: rw.splice(2, 1), fourthColumnData: displayNextPayout },
  { title: 'Pending', fourthColumn: 'Status', data: rw.splice(1, 2), fourthColumnData: displayStatus },
  { title: 'Past', fourthColumn: 'Last Payout', data: rw.splice(0, 3), fourthColumnData: displayLastPayout },
]

// put condition inside: if is 3rd column -> sepccia

const Overview = ({ rewards, openDetails }) => {
  const rewardsEmpty = rewards.length === 0
/*
    if (rewardsEmpty) {
      return <Empty tab='Overview' action={props.onNewReward} />
    }
*/
  return (
    <Main>
      {averageRewards(145, 19989.88, 19989.87)}

      <RewardsWrap>
        {tableType.map(({ title, fourthColumn, data, fourthColumnData }) => (
          <RewardsTable
            key={title}
            title={title}
            fourthColumn={fourthColumn}
            fourthColumnData={fourthColumnData}
            data={data}
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
    </Main>
  )

}

Overview.propTypes = {
  onNewReward: PropTypes.func.isRequired,
  rewards: PropTypes.arrayOf(PropTypes.object).isRequired,
}
const AverageItem = styled.div`
  text-align: center;
  margin: 2px;
  /*background: orange;*/
`
const AverageRewards = styled.div`
  /*background: #FFF38E;*/
  padding: 10px;
  display: flex;
  justify-content: space-around;
  border: 1px solid grey;
  background-color: white;
`
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
const LeaderBoardWrap = styled.div`
  ${breakpoint(
    'medium',
    `
    width: 300px;
    `
  )};

  width: 100%;
  /*background: #8196FF;*/
  padding: 10px;
`

const LeadersLlist = styled.ul`
  /*background: green;*/
  list-style: none;
  li {
    display: flex;
    justify-content: space-between;
  }
`
export default Overview
