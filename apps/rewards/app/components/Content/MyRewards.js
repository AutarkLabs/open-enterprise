import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  Text,
  Button,
  IdentityBadge,
} from '@aragon/ui'
import { displayCurrency } from '../../utils/helpers'
import { AverageRewards, formatAvgAmount } from './RewardsTables'
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

const truncateCreator = creator => `${creator.slice(0, 6)}...${creator.slice(-4)}`
const translateToken = (token) => {
  if (token == 0x0) {
    return 'ETH'
  }
}

               // entity="0x83750D4865AdC68D48bdCc78aEa70C1d79c18e15"
const MyRewardsTable = ({ claimed, data, openDetails, network }) => {
  return (
    <div>
      <Text.Block size="large" weight="bold">
        {claimed ? 'Claimed' : 'Unclaimed'} Rewards
      </Text.Block>
    
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
              <Text>{reward.description}</Text>
            </TableCell>
            <TableCell>
              <IdentityBadge
                networkType={network.type}
                entity={reward.creator + '-'}
                shorten={true}
              />
            </TableCell>
            <TableCell>
              {claimed ? (<Button>Claim</Button>) : '10/11/12'}
            </TableCell>
            <TableCell>{displayCurrency(reward.amount)}{' '}{translateToken(reward.rewardToken)}</TableCell>
          </ClickableTableRow>
        ))}
      </Table>
    </div>
  )
}

const MyRewards = ({ rewards, newReward, openDetails }) => {
  const rewardsEmpty = rewards.length === 0

  if (rewardsEmpty) {
    return <Empty tab='MyRewards' action={onNewReward} />
  }

const network = { type: 'type' }

  return (
    <Main>
      <RewardsWrap>
        <AverageRewards
          titles={averageRewardsTitles}
          numbers={averageRewardsNumbers}
        />

        <MyRewardsTable
          claimed={true}
          data={rewards}
          openDetails={openDetails}
          network={network}
        />
        <MyRewardsTable
          claimed={false}
          data={rewards}
          openDetails={openDetails}
          network={network}
        />
      </RewardsWrap>
    </Main>
  )
}

MyRewards.propTypes = {
  onNewReward: PropTypes.func.isRequired,
  rewards: PropTypes.arrayOf(PropTypes.object).isRequired,
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
//export default MyRewards
