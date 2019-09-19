import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Badge, Text, Viewport } from '@aragon/ui'

import { CARD_STRETCH_BREAKPOINT } from '../../utils/responsive'
import { Account } from '../Card'

const Accounts = ({
  accounts,
  onNewAllocation,
}) => {
  if (!accounts) return

  return (
    <Viewport>
      {({ width }) => {
        const screenSize = width

        return (
          <StyledAccounts screenSize={screenSize}>
            <Text.Block size="large" weight="bold" style={{ marginBottom: '10px', width: '100%' }}>
              Accounts
              {' '}
              <Badge.Info>{accounts.length}</Badge.Info>
            </Text.Block>
            {accounts.map(({ accountId, data }) => (
              <Account
                balance={data.balance}
                description={data.metadata}
                key={accountId}
                id={accountId}
                onNewAllocation={onNewAllocation}
                proxy={data.proxy}
                screenSize={screenSize}
              />
            ))}
          </StyledAccounts>
        )
      }}
    </Viewport>
  )
}

Accounts.propTypes = {
  // TODO: Create account shape
  accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNewAllocation: PropTypes.func.isRequired,
}

const StyledAccounts = styled.div`
  display: flex;
  flex-direction: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? 'column' : 'row'};
  flex-wrap: wrap;
`

export default Accounts
