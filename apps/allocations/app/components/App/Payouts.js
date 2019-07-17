import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { BigNumber } from 'bignumber.js'

import {
  ContextMenu,
  ContextMenuItem,
  IconCheck,
  IconCross,
  IconFundraising,
  IconTime,
  Text,
  breakpoint,
  theme,
} from '@aragon/ui'

import { displayCurrency, sortByDateKey } from '../../utils/helpers'
import {
  AmountBadge,
  NarrowList,
  NarrowListPayout,
  PayoutDescription,
  PayoutsTable,
} from './PayoutsTables'

const translateToken = (payoutToken, tokens) => {
  if (payoutToken === '0x0000000000000000000000000000000000000000') {
    return 'ETH'
  }
  const index = tokens.findIndex(a => a.address === payoutToken)
  if (index > 0) {
    return tokens[index].symbol
  }
  return 'Undefined'
}

const PayoutStatusWrapper = ({ color, icon, title, posTop = 0 }) => {
  const Icon = icon
  return (
    <PayoutStatus color={color}>
      <Icon style={{ position: 'relative', top: posTop, marginRight: '10px' }} />
      {title}
    </PayoutStatus>
  )
}

PayoutStatusWrapper.propTypes = {
  color: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  posTop: PropTypes.number.isRequired
}

const ShowStatus = ({ distSet, recurring, startTime }) => {
  let status
  if (!recurring) {
    if (distSet) status = 1
    else if (!distSet) status = 2
    else status = 3
  }
  else {
    if (Date.now() < startTime) status = 0
    else status = 1
  }
  switch (status) {
  case 0: return <PayoutStatusWrapper title="Distribution in progress..." icon={IconTime} color={theme.textSecondary} posTop={1} />
  case 1: return <PayoutStatusWrapper title="Ready to distribute" icon={IconFundraising} color="#F5A623" posTop={7} />
  case 2: return <PayoutStatusWrapper title="Distributed" icon={IconCheck} color={theme.positive} />
  case 3: return <PayoutStatusWrapper title="Rejected" icon={IconCross} color={theme.negative} />
  }
}

ShowStatus.propTypes = {
  distSet: PropTypes.bool.isRequired,
  recurring: PropTypes.bool.isRequired,
  startTime: PropTypes.instanceOf(Date).isRequired
}


const PayoutsNarrow = ({ executePayout, data, tokens }) => (
  <NarrowList>
    {data.map((payout, i) => (
      <NarrowListPayout key={i}>
        <div style={{ marginTop: '5px', marginRight: '10px' }}>
          <PayoutDescription>
            {payout.description}
          </PayoutDescription>
          <Text.Block size="small" color={theme.textTertiary}>
            {ShowStatus(payout)}
          </Text.Block>
        </div>
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center' }}>
          <div style={{ marginRight: '10px' }}>
            <AmountBadge>
              {displayCurrency(BigNumber(payout.amount))}{' '}{translateToken(payout.token, tokens)}
            </AmountBadge>
          </div>
          <div>
            {payout.distSet &&
              (
                <ContextMenu>
                  <ContextMenuItem onClick={() => { executePayout(payout.accountId, payout.payoutId) }}>
                    <IconFundraising />
                    <ActionLabel>Distribute Allocation</ActionLabel>
                  </ContextMenuItem>
                </ContextMenu>
              )}
          </div>
        </div>
      </NarrowListPayout>
    ))}
  </NarrowList>
)

PayoutsNarrow.propTypes = {
  executePayout: PropTypes.func.isRequired,
  data: PropTypes.array.isRequired,
  tokens: PropTypes.array.isRequired
}


const Payouts = ({ executePayout, payouts, tokens }) => {
  const payoutsEmpty = payouts.length === 0
  if (payoutsEmpty) {
    return null
  }

  // Payouts cannot be directly mutated since it is a prop
  // The solution does only a shallow copy
  const sortedPayouts = [...payouts].sort(sortByDateKey('startTime'))

  return (
    <PayoutsWrap>
      <PayoutsTable
        data={sortedPayouts}
        tokens={tokens}
        executePayout={executePayout}
        list={PayoutsNarrow}
      />
    </PayoutsWrap>
  )
}

Payouts.propTypes = {
  executePayout: PropTypes.func.isRequired,
  payouts: PropTypes.arrayOf(PropTypes.object).isRequired,
  // TODO: shape the object
  tokens: PropTypes.arrayOf(PropTypes.object).isRequired
}

const ActionLabel = styled.span`
  margin-left: 15px;
`

const PayoutStatus = styled(Text.Block).attrs({
  size: 'small'
})`
  margin-top: 5px;
`

const PayoutsWrap = styled.div`
  ${breakpoint(
    'small',
    `
    padding: 0 2rem 2rem 2rem;
    `
  )};
  padding: 0.3rem;
  flex-grow: 1;
  > :not(:last-child) {
    margin-bottom: 20px;
  }
`

export default Payouts
