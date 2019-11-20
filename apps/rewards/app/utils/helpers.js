import PropTypes from 'prop-types'
import {
  ETH_DECIMALS,
  ETH_DECIMALS_NUMBER,
  RECURRING_DIVIDEND,
} from './constants'
import BigNumber from 'bignumber.js'
import {
  GU,
  IconCheck,
  IconCircleCheck,
  IconClock,
  Text,
  useTheme,
} from '@aragon/ui'
import React from 'react'

export const displayCurrency = (amount, decimalsNumber=ETH_DECIMALS_NUMBER) => {
  const decimals = BigNumber(10).pow(decimalsNumber)
  return BigNumber(amount).div(decimals).dp(3).toString()
}
export const toWei = amount => {
  return BigNumber(amount).times(ETH_DECIMALS).toNumber()
}

const types = {
  claimed: { icon: IconCircleCheck, text: 'Claimed', color: 'positive' },
  ready: { icon: IconCheck, text: 'Ready to claim', color: 'positive' },
  pending: { icon: IconClock, text: 'Pending', color: 'warning' },
}

const Status = ({ type }) => {
  const theme = useTheme()
  const status = types[type]
  const text = status.text
  const Icon = status.icon
  const color = theme[status.color]
  return (
    <div css='display: flex;'>
      <Icon style={{
        marginRight: 0.5 * GU + 'px',
        marginTop: -0.25 * GU + 'px',
        color: color,
      }} />
      <Text>
        {text}
      </Text>
    </div>
  )
}

Status.propTypes = {
  type: PropTypes.oneOf(Object.keys(types)).isRequired,
}

export const getStatus = ({
  rewardType,
  timeClaimed,
  endDate,
  claims,
  disbursements
}) => {
  if (rewardType === RECURRING_DIVIDEND)
    return claims === disbursements.length ? <Status type="claimed" /> : (
      Date.now() > disbursements[claims].getTime() ? <Status type="ready" /> :
        <Status type="pending" />
    )
  else return timeClaimed > 0 ? <Status type="claimed" /> : (
    Date.now() > endDate ? <Status type="ready" /> : <Status type="pending" />
  )
}
