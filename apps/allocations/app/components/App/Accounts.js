import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, Badge, breakpoint } from '@aragon/ui'

import { Account, Empty } from '../Card'

const Accounts = ({
  accounts,
  onNewAccount,
  onNewAllocation,
  onExecutePayout,
  app,
}) => {
  if (!accounts) return
  const accountsEmpty = accounts.length === 0
  const accountsMap = accounts.map(({ data, accountId }) => (
    <Account
      // TODO: Make this more unique by other id?
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
  ))

  if (accountsEmpty) {
    return <Empty action={onNewAccount} />
  }
  return (
    <Main>
      <Text.Block size="large" weight="bold" style={{ marginBottom: '10px' }}>
        Accounts
        {' '}
        <Badge.Info>{accounts.length}</Badge.Info>
      </Text.Block>
      <StyledAccounts>{accountsMap}</StyledAccounts>
    </Main>  
  )
}

Accounts.propTypes = {
  // TODO: Create account shape
  accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNewAccount: PropTypes.func.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
}

const Main = styled.section`
  padding: 30px;
` 

const StyledAccounts = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: 290px;
  grid-gap: 20px;
  justify-content: start;
  
  ${breakpoint(
    'medium',
    `
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    `
  )};
`

export default Accounts
