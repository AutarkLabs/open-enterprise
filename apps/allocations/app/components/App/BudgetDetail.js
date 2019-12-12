import React, { useState } from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import { useAragonApi, usePath } from '../../api-react'
import {
  BREAKPOINTS,
  BackButton,
  Bar,
  Box,
  Button,
  GU,
  Header,
  IconPlus,
  ProgressBar,
  Text,
  textStyle,
  useTheme,
} from '@aragon/ui'

import { usePanel } from '../../context/Panel'
import { AllocationsHistory } from '.'
import BudgetContextMenu from '../BudgetContextMenu'

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

function InfoBlock({ children, className, title }) {
  const theme = useTheme()
  return (
    <div className={className}>
      <div css={`
          ${textStyle('label2')};
          margin-bottom: ${GU}px;
          color: ${theme.surfaceContentSecondary};
        `}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

InfoBlock.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
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

const Grid = styled.div`
  display: grid;
  grid-gap: ${2 * GU}px;
  grid-template-areas:
    "main"
    "budget"
    ${p => p.active && '"period"'}
    "allocations";

  @media (min-width: ${BREAKPOINTS.large}px) {
    grid-template-columns: 3fr 1fr;
    grid-template-rows: repeat(3, auto);
    grid-template-areas:
      "main budget"
      "main period"
      "allocations period";
  }
`

export default function BudgetDetail() {
  const { appState } = useAragonApi()
  const [ path, requestPath ] = usePath()
  const { newAllocation } = usePanel()
  const period = usePeriod()
  const patientlyRequestPath = usePatientRequestPath()
  const theme = useTheme()

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
        secondary={budget.active && (
          <Button
            mode="strong"
            icon={<IconPlus />}
            onClick={() => newAllocation(id)}
            label="New allocation"
          />
        )}
      />
      <Bar>
        <BackButton onClick={() => requestPath('/')} />
      </Bar>
      <Grid active={budget.active}>
        <div css="grid-area: main">
          <Box heading="Budget">
            <div css="display: flex; justify-content: space-between">
              <Text size="great" style={{ marginBottom: 2 * GU + 'px' }}>
                {budget.name}
              </Text>
              <BudgetContextMenu budget={budget} />
            </div>
            {budget.active && (
              <>
                <div css="display: flex">
                  <InfoBlock css="flex: 1" title="Budget">
                    <CurrencyValue
                      amount={budget.amount}
                      token={budget.token}
                      context="per 30 days"
                    />
                  </InfoBlock>
                  <InfoBlock css="flex: 1" title="Utilized">
                    <CurrencyValue
                      amount={utilized}
                      token={budget.token}
                      context={percentOf(utilized, budget.amount)}
                    />
                  </InfoBlock>
                  <InfoBlock css="flex: 1" title="Remaining">
                    <CurrencyValue
                      amount={budget.remaining}
                      token={budget.token}
                      context={percentOf(budget.remaining, budget.amount)}
                    />
                  </InfoBlock>
                </div>
                <div css={`margin-top: ${3 * GU}px; margin-bottom: ${GU}px`}>
                  <ProgressBar
                    color={String(theme.accentEnd)}
                    value={utilized / budget.amount}
                  />
                </div>
              </>
            )}
          </Box>
        </div>
        <div css="grid-area: budget">
          <Box
            css="margin-top: 0 !important"
            heading="Budget info"
          >
            <InfoBlock title="Budget ID">
              #{budget.id}
            </InfoBlock>
          </Box>
        </div>
        {budget.active && (
          <div css="grid-area: period">
            <Box
              css="margin-top: 0 !important"
              heading="Period info"
            >
              <InfoBlock title="Start Date">
                {formatDate(period.startDate)}
              </InfoBlock>
              <InfoBlock css={`margin-top: ${2 * GU}px`} title="End Date">
                {formatDate(period.endDate)}
              </InfoBlock>
            </Box>
          </div>
        )}
        { !!allocations.length &&
          <div css="grid-area: allocations">
            <AllocationsHistory allocations={allocations} />
          </div>
        }
      </Grid>
    </>
  )
}
