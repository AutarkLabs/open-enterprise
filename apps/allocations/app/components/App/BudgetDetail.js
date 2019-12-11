import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import { useAragonApi, usePath } from '../../api-react'
import {
  BackButton,
  Bar,
  Box,
  GU,
  Header,
  Text,
  textStyle,
  useTheme,
} from '@aragon/ui'

import { AllocationsHistory } from '.'

const ID_REGEX = new RegExp('^/budgets/(?<id>[0-9]+)')

const percentOf = (smaller, bigger) =>
  `${BigNumber(100 * smaller / bigger).dp(1).toString()}%`

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

export default function BudgetDetail() {
  const { appState } = useAragonApi()
  const [ path, requestPath ] = usePath()

  const matchData = path.match(ID_REGEX)
  if (!matchData) {
    requestPath('/')
    return null
  }

  const { id } = matchData.groups

  const budget = appState.budgets.find(b => b.id === id)
  if (!budget) {
    requestPath('/')
    return null
  }

  const allocations = (appState.allocations || []).filter(a => a.accountId === id)

  const utilized = budget.amount - budget.remaining

  return (
    <>
      <Header
        primary="Allocations"
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
            context="per 4 weeks"
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
      { !!allocations.length && <AllocationsHistory allocations={allocations} /> }
    </>
  )
}
