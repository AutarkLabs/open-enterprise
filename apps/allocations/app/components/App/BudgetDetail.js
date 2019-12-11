import React, { useState } from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import { useAragonApi, usePath } from '../../api-react'
import {
  BackButton,
  Bar,
  Box,
  Button,
  GU,
  Header,
  IconPlus,
  Text,
  textStyle,
  useTheme,
} from '@aragon/ui'

import { usePanel } from '../../context/Panel'
import { AllocationsHistory } from '.'

const ID_REGEX = new RegExp('^/budgets/(?<id>[0-9]+)')

const percentOf = (smaller, bigger) =>
  `${BigNumber(100 * smaller / bigger).dp(1).toString()}%`

const formatDate = date =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: 'long',
  }).format(date)

function CurrencyValue({ amount, context, token }) {
  const theme = useTheme()

  const main = BigNumber(amount)
    .div(10 ** token.decimals)
    .dp(3)
    .toNumber()
    .toLocaleString()

  return (
    <>
      <Text.Block>
        <Text size="xlarge">
          {main + ' '}
        </Text>
        <Text size="small">{token.symbol}</Text>
      </Text.Block>
      <Text.Block size="small" color={`${theme.surfaceContentSecondary}`}>
        {context}
      </Text.Block>
    </>
  )
}

CurrencyValue.propTypes = {
  amount: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]).isRequired,
  token: PropTypes.shape({
    decimals: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]).isRequired,
    symbol: PropTypes.string.isRequired,
  }).isRequired,
  context: PropTypes.string.isRequired,
}

function InfoBlock({ children, title }) {
  const theme = useTheme()
  return (
    <>
      <div css={`
          ${textStyle('label2')};
          margin-bottom: ${GU}px;
          color: ${theme.surfaceContentSecondary};
          &:not(:first-child) {
            margin-top: ${2 * GU}px;
          }
        `}
      >
        {title}
      </div>
      {children}
    </>
  )
}

InfoBlock.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
}

// if this page is the first page loaded for the user,
// we may still have incomplete state from aragonAPI;
// let's give it a second before redirecting
const usePatientRequestPath = () => {
  const [ , requestPath ] = usePath()
  const [ firstTry, setFirstTry ] = useState(true)
  return path => {
    if (firstTry) {
      setTimeout(() => setFirstTry(false), 1000)
    } else {
      requestPath(path)
    }
  }
}

function usePeriod() {
  const { appState } = useAragonApi()
  if (!appState.period) return {}

  let { startDate, endDate } = appState.period
  const duration = endDate - startDate

  // if user visits page from the timeframe of what should be the *next*
  // period, but the period has not yet been updated on-chain, show them the
  // period as it will be calculated for their date
  while (endDate < new Date()) {
    startDate = new Date(endDate.getTime() + 1000)
    endDate = new Date(startDate.getTime() + duration)
  }

  return { startDate, endDate }
}

export default function BudgetDetail() {
  const { appState } = useAragonApi()
  const [ path, requestPath ] = usePath()
  const { newAllocation } = usePanel()
  const period = usePeriod()
  const patientlyRequestPath = usePatientRequestPath()

  const matchData = path.match(ID_REGEX)
  if (!matchData) {
    requestPath('/')
    return null
  }

  const { id } = matchData.groups

  const budget = appState.budgets.find(b => b.id === id)
  if (!budget) {
    patientlyRequestPath('/')
    return null
  }

  const allocations = (appState.allocations || []).filter(a => a.accountId === id)
  const utilized = budget.amount - budget.remaining

  return (
    <>
      <Header
        primary="Allocations"
        secondary={
          <Button
            mode="strong"
            icon={<IconPlus />}
            onClick={() => newAllocation(id)}
            label="New allocation"
          />
        }
      />
      <Bar>
        <BackButton onClick={() => requestPath('/')} />
      </Bar>
      <Box heading="Budget">
        <Text.Block size="great" style={{ marginBottom: 2 * GU + 'px' }}>
          {budget.name}
        </Text.Block>
        <InfoBlock title="Budget">
          <CurrencyValue
            amount={budget.amount}
            token={budget.token}
            context="per 30 days"
          />
        </InfoBlock>
        <InfoBlock title="Utilized">
          <CurrencyValue
            amount={utilized}
            token={budget.token}
            context={percentOf(utilized, budget.amount)}
          />
        </InfoBlock>
        <InfoBlock title="Remaining">
          <CurrencyValue
            amount={budget.remaining}
            token={budget.token}
            context={percentOf(budget.remaining, budget.amount)}
          />
        </InfoBlock>
      </Box>
      <Box heading="Budget info">
        <InfoBlock title="Budget ID">
          #{budget.id}
        </InfoBlock>
      </Box>
      <Box heading="Period info">
        <InfoBlock title="Start Date">
          {formatDate(period.startDate)}
        </InfoBlock>
        <InfoBlock title="End Date">
          {formatDate(period.endDate)}
        </InfoBlock>
      </Box>
      { !!allocations.length && <AllocationsHistory allocations={allocations} /> }
    </>
  )
}
