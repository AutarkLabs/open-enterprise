import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, Badge, Viewport } from '@aragon/ui'

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
    <React.Fragment>
      <Text.Block size="large" weight="bold" style={{ marginBottom: '10px' }}>
        Accounts
        {' '}
        <Badge.Info>{accounts.length}</Badge.Info>
      </Text.Block>
      <Viewport>
        {({ width }) => {
          const screenSize = width

          return (
            <StyledAccounts screenSize={screenSize}> 
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
    </React.Fragment>
  )
}

Accounts.propTypes = {
  // TODO: Create account shape
  accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNewAccount: PropTypes.func.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
}

const StyledAccounts = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding: ${props => props.screenSize < 600 ? '0' : '1rem'};
`
export default Accounts
