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
  Viewport,
  theme,
  IconCheck,
  IconCross,
  IconFundraising,
  IconTime,
  ContextMenu,
  ContextMenuItem,
} from '@aragon/ui'
import { displayCurrency } from '../../utils/helpers'
import {
  PayoutDescription,
  PayoutsTable,
  NarrowList,
  NarrowListPayout,
  AmountBadge,
} from './PayoutsTables'
import { Empty } from '../Card'
import { provideNetwork } from '../../../../../shared/ui'

const translateToken = (token) => {
  if (token == 0x0) {
    return 'ETH'
  }
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

const showStatus = (status = 3) => {
  switch(status) {
  case 0: return <PayoutStatusWrapper title="Claim in progress..." icon={IconTime} color={theme.textSecondary} posTop={1} />
  case 1: return <PayoutStatusWrapper title="Ready to claim" icon={IconFundraising} color="#F5A623" posTop={7} />
  case 2: return <PayoutStatusWrapper title="Claimed" icon={IconCheck} color={theme.positive} />
  case 3: return <PayoutStatusWrapper title="Rejected" icon={IconCross} color={theme.negative} />
  }
}

const PayoutStatus = styled(Text.Block).attrs({
  size: 'small'
})`
  margin-top: 5px;
`
const PayoutsNarrow = ({ executePayout, claimed, data, openDetails, network }) => (
  <NarrowList>
    {data.map((payout, i) => (
      <NarrowListPayout key={i}>
        <div style={{ marginTop: '5px', marginRight: '10px' }}>
          <PayoutDescription>
            {payout.description}
          </PayoutDescription>
          <Text.Block size="small" color={theme.textTertiary} style={{ marginTop: '5px' }}>
            {showStatus(payout.status)}
          </Text.Block>
        </div>
        <div style={{ display: 'flex', flexWrap: 'nowrap', alignItems: 'center' }}>
          <div style={{ marginRight: '10px' }}>
            <AmountBadge>
              {displayCurrency(payout.amount)}{' '}{translateToken(payout.rewardToken)}
            </AmountBadge>
          </div>
          <div>
            <ContextMenu>
              <ContextMenuItem onClick={executePayout}>
                <IconFundraising />
                <ActionLabel>Distribute Allocation</ActionLabel>
              </ContextMenuItem>
            </ContextMenu>
          </div>
        </div>
      </NarrowListPayout>
    ))}
  </NarrowList>
)

const Payouts = ({ payouts, executePayout, network }) => {
  const payoutsEmpty = payouts.length === 0

  if (payoutsEmpty) {
    return null
  }

  return (
    <Main>
      <PayoutsWrap>

        <PayoutsTable
          data={payouts}
          network={network}
          executePayout={executePayout}
          belowMedium={PayoutsNarrow}
          aboveMedium={PayoutsNarrow}
        />
      </PayoutsWrap>
    </Main>
  )
}

Payouts.propTypes = {
  payouts: PropTypes.arrayOf(PropTypes.object).isRequired,
  network: PropTypes.object,
}

const Main = styled.div`
  padding: 10px;
  background-color: #F8FCFD;
`
const PayoutsWrap = styled.div`
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
const ActionLabel = styled.span`
  margin-left: 15px;
`

export default provideNetwork(Payouts)
