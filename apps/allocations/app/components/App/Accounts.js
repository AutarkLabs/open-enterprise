import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, Badge, Viewport, breakpoint } from '@aragon/ui'
import { CARD_STRETCH_BREAKPOINT } from '../../utils/responsive'

import { Account, Empty } from '../Card'

const Accounts = ({
  accounts,
  onNewAccount,
  onNewAllocation,
  onExecutePayout,
  app,
}) => {
  if (!accounts) return

  if (accounts.length === 0) {
    return <Empty action={onNewAccount} />
  }

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
            {accounts.map(({ data, accountId }) => (
              <Account
                screenSize={screenSize}
                key={accountId}
                id={accountId}
                proxy={data.proxy}
                balance={data.balance}
                token={data.token}
                description={data.metadata}
                onNewAllocation={onNewAllocation}
                onExecutePayout={onExecutePayout}
                app={app}
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
  onNewAccount: PropTypes.func.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
}

const StyledAccounts = styled.div`
  ${breakpoint(
    'small',
    `
    padding: 2rem;
    `
  )};
  padding: 0.3rem;
  display: flex;
  flex-direction: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? 'column' : 'row' };
  flex-wrap: wrap;
`

export default Accounts
