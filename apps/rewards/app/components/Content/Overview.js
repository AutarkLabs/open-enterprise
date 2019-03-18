import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Badge, Table, TableHeader, TableRow, TableCell, Text, breakpoint } from '@aragon/ui'
import { FieldTitle } from '../Form'

import { Empty } from '../Card'

const rw = [
{ isMerit: true, referenceToken: 'REF', rewardToken: 'ETH', amount: 0.1, endBlock: 0, delay: 200, rewardAmount: 2.1, description: 'Coral', },
{ isMerit: true, referenceToken: 'REF', rewardToken: 'ETH', amount: 10, endBlock: 0, delay: 400, rewardAmount: 0.1, description: 'MJ', },
{ isMerit: false, referenceToken: 'SCC', rewardToken: 'DAI', amount: 7.2, endBlock: 0, delay: 0, rewardAmount: 44, description: 'desc', },
{ isMerit: true, referenceToken: 'REF', rewardToken: 'DAI', amount: 3.9, endBlock: 0, delay: 0, rewardAmount: 1, description: 'Coral', },
{ isMerit: true, referenceToken: 'REF', rewardToken: 'ETH', amount: 100.1, endBlock: 0, delay: 200, rewardAmount: 200, description: 'Coral', },
{ isMerit: true, referenceToken: 'REF', rewardToken: 'ETH', amount: 310, endBlock: 0, delay: 2000, rewardAmount: 3.98, description: 'SD', },
]

const leaders = [
{name: 'Aralah Beshenal', amount: 10},
{name: 'Jix Gaian', amount: 0.8},
{name: 'Jonathan Baric', amount: 230},
{name: 'Kruineph Leandar', amount: 40},
{name: 'Adam Jervada', amount: 4.02},
{name: 'Raile Ores', amount: 9500},
{name: 'Molan Gemini', amount: 63},
{name: 'Cally Quamar', amount: 19},
{name: 'Jaden Korrado', amount: 16.4},
{name: 'Calaveylon Versio', amount: 16.3},
{name: 'Jobal Antilles', amount: 9},
{name: 'Fias Korror', amount: 31},
{name: 'Dorian Eclissu	', amount: 3.9},
]

const rewardsTable = rewards => (
  <Table
    header={
      <TableRow>
        <TableHeader title="Description" />
        <TableHeader title="Type" />
        <TableHeader title="Cycle" />
        <TableHeader title="Next payout" />
        <TableHeader title="Amount" />
      </TableRow>
    }>

{rewards.map(reward => (
    <TableRow>
      <TableCell>
        <Text>{reward.description}</Text>
        <Badge>{reward.referenceToken}</Badge>
      </TableCell>
      <TableCell>
        {reward.isMerit ? 'Merit' : 'Dividend'}
      </TableCell>
      <TableCell>
        Monthly
      </TableCell>
      <TableCell>
        10/10/13
      </TableCell>
      <TableCell>
         {reward.rewardAmount}
      </TableCell>
    </TableRow>
))}
  </Table>
)

const leadersList = leaders => (
  <LeadersLlist>
    {leaders.sort((l1, l2) => l1.amount < l2.amount ? 1 : -1).map(leader => (
      <li><span>{leader.name}</span><span style={{ fontWeight: 'bold' }}>$ {leader.amount}</span></li>
    ))}
  </LeadersLlist>
)

const currentRewards = () => (
  <div>
    <Text.Block size="large" weight="bold">
      Current Rewards
    </Text.Block>
    {rewardsTable(rw.splice(0,3))}
  </div>
)

const pendingRewards = () => (
  <div>
    <Text.Block size="large" weight="bold">
      Pending Rewards
    </Text.Block>
    {rewardsTable(rw.splice(1,2))}
  </div>
)

const averageAmount = amount => {
  const formatted = amount.toLocaleString().split('.')
  return formatted[1] ?
    <Text.Block size="xlarge" weight="bold">${formatted[0]}.<Text size="large" weight="bold">{formatted[1]}</Text></Text.Block>
    :
    <Text.Block size="xlarge" weight="bold">${formatted[0]}</Text.Block>
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

const Overview = (props) => {
  const rewardsEmpty = props.rewards.length === 0

  return (
    <Main>

      <RewardsWrap>
        {averageRewards(145, 19989.88, 19989.87)}
        {currentRewards()}
        {pendingRewards()}
      </RewardsWrap>

      <LeaderBoardWrap>
        <FieldTitle style={{ borderBottom: '1px solid grey', marginBottom: '10px'}}>
          Leaderboard
        </FieldTitle>
        {leadersList(leaders)}
      </LeaderBoardWrap>

    </Main>
  )

  //if (rewardsEmpty) {
  //  return <Empty tab='Overview' action={props.onNewReward} />
  //}
  return <StyledRewards>Rewards Go Here</StyledRewards>
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
`
const Main = styled.div`
  /*background: #FFF38E;*/
  padding: 10px;
  display: flex;
  ${breakpoint(
    'medium',
    `
    flex-wrap: nowrap;
    `
  )};
  flex-wrap: wrap;
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
