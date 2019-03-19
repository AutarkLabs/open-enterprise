import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, theme } from '@aragon/ui'
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
AverageRewards.propTypes = {
  titles: PropTypes.arrayOf(PropTypes.string).isRequired,
  numbers: PropTypes.arrayOf(PropTypes.object).isRequired,
}
  

export { AverageRewards, formatAvgAmount }