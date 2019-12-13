import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useAragonApi } from '../../api-react'
import { Box, GU, Text, textStyle, useTheme } from '@aragon/ui'
import throttle from 'lodash.throttle'
import BigNumber from 'bignumber.js'
import usePeriod from '../../hooks/usePeriod'
import { ETHER_TOKEN_FAKE_ADDRESS, isTokenVerified } from '../../../../../shared/utils/token-utils'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const MONTHS = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]
const CONVERT_API_BASE = 'https://min-api.cryptocompare.com/data'
const CONVERT_THROTTLE_TIME = 5000

const convertApiUrl = symbols =>
  `${CONVERT_API_BASE}/price?fsym=USD&tsyms=${symbols.join(',')}`

const processTime = ms => {
  const days = Math.round(ms/MS_PER_DAY)
  if(days%7 === 0){
    const weeks = days/7
    return [ String(weeks), `week${weeks === 1 ? '' : 's'}` ]
  }
  return [ String(days), `day${days === 1 ? '' : 's'}` ]
}

const getBudgetTotals = (budgets, rates) => {
  if(budgets.length && rates){
    const convertedBudgets = budgets.map(budget => {
      const rate = rates[budget.token.symbol]
      return {
        amount: rate ? (new BigNumber(budget.amount)).div(rate).div(10**budget.token.decimals) : new BigNumber(0),
        remaining: rate ? (new BigNumber(budget.remaining)).div(rate).div(10**budget.token.decimals) : new BigNumber(0)
      }

    })

    return convertedBudgets.reduce((total, budget) => {
      return {
        amount: total.amount.plus(budget.amount),
        remaining: total.remaining.plus(budget.remaining)
      }
    })
  } else {
    return {
      amount: new BigNumber(0),
      remaining: new BigNumber(0)
    }
  }
}

const PeriodDetails = () => {
  const { appState : { budgets = [] } } = useAragonApi()
  const { startDate, endDate, duration } = usePeriod()
  const [ rates, setRates ] = useState(null)
  const { amount, remaining } = getBudgetTotals(budgets, rates)
  const durationArray = processTime(duration)
  const remainingArray = processTime(endDate - new Date())

  const updateConvertedRates = throttle(async () => {
    if(budgets.length) {
      const symbols = budgets.filter(({ token }) => isTokenVerified(token.symbol))
        .map(({ token }) => token.symbol)
      const res = await fetch(convertApiUrl(symbols))
      const convertRates = await res.json()
      if (JSON.stringify(rates) !== JSON.stringify(convertRates)) {
        setRates(convertRates)
      }
    }
  }, CONVERT_THROTTLE_TIME)

  updateConvertedRates()

  return (
    <Box heading="Account Period Details" css={`margin-bottom: ${2 * GU}px;`}>
      <div css={`
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      `}>
        <InfoBlock
          title="Budgeted"
          large={amount.dp(0).toNumber().toLocaleString()}
          small='USD'
        />
        <InfoBlock
          title="Budget utilized"
          large={amount.eq(0) && remaining.eq(0) ? '0' : amount.minus(remaining).div(amount).times(100).dp(0).toString()}
          small='%'
        />
        <InfoBlock
          title="Period duration"
          large={durationArray[0]}
          small={durationArray[1]}
        />
        <InfoBlock
          title="Next period"
          large={`${MONTHS[endDate.getMonth()]} ${endDate.getDate()}`}
          small={endDate.getFullYear().toString()}
        />
        <InfoBlock
          title="Time remaining"
          large={remainingArray[0]}
          small={remainingArray[1]}
        />
      </div>
    </Box>
  )
}

const InfoBlock = ({ title, large, small }) => {
  const theme = useTheme()
  return (
    <div css={`margin: ${2 * GU}px 0`}>
      <div css={`
          ${textStyle('label2')};
          margin-bottom: ${GU}px;
          color: ${theme.surfaceContentSecondary};
        `}
      >
        {title}
      </div>
      <Text.Block>
        <Text size="xlarge">
          {large + ' '}
        </Text>
        <Text size="small">{small}</Text>
      </Text.Block>
    </div>
  )
}

InfoBlock.propTypes = {
  title: PropTypes.string,
  large: PropTypes.string,
  small: PropTypes.string,
}

export default PeriodDetails
