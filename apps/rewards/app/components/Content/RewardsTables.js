import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, theme, Viewport, Badge } from '@aragon/ui'
import { FieldTitle } from '../Form'

const formatAvgAmount = (amount, symbol, color = 'black') => {
  const formatted = amount.toLocaleString().split('.')
  return formatted[1] ? (
    <Text.Block size="xlarge" weight="bold" color={color}>
      {symbol}{formatted[0]}.
      <Text size="large" weight="bold">
        {formatted[1]}
      </Text>
    </Text.Block>
  ) : (
    <Text.Block size="xlarge" weight="bold" color={color}>
      {symbol}{formatted[0]}
    </Text.Block>
  )
}
  
const AverageRewards = ({ titles, numbers }) => (
  <AverageRewardsTable>
    <AverageItem>
      <FieldTitle>{titles[0]}</FieldTitle>
      {numbers[0]}
    </AverageItem>
    <AverageItem>
      <FieldTitle>{titles[1]}</FieldTitle>
      {numbers[1]}
    </AverageItem>
    <AverageItem>
      <FieldTitle>{titles[2]}</FieldTitle>
      {numbers[2]}
    </AverageItem>
  </AverageRewardsTable>
)
AverageRewards.propTypes = {
  titles: PropTypes.arrayOf(PropTypes.string).isRequired,
  numbers: PropTypes.arrayOf(PropTypes.object).isRequired,
}
  
const RewardsTable = props => {
  const Narrow = props.belowMedium
  const Wide = props.aboveMedium

  return (
    <div>
      <Text.Block size="large" weight="bold">
        {props.title}
      </Text.Block>

      <Viewport>
        {({ below }) =>
          below('medium') ? (
            <Narrow {...props} />
          ) : (
            <Wide {...props} />
          )
        }
      </Viewport>
    </div>
  )
}

RewardsTable.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  belowMedium: PropTypes.func.isRequired,
  aboveMedium: PropTypes.func.isRequired,
}

const RewardDescription = styled(Text.Block)`
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${theme.textPrimary};
`
const AverageItem = styled.div`
  text-align: center;
  margin: 2px;
  /*background: orange;*/
`
const AverageRewardsTable = styled.div`
  /*background: #FFF38E;*/
  padding: 10px;
  display: flex;
  justify-content: space-around;
  border: 1px solid ${theme.contentBorder};
  background-color: white;
  border-radius: 3px;
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
export { AverageRewards, formatAvgAmount, RewardDescription, RewardsTable, NarrowList, NarrowListReward, AmountBadge }

