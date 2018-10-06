import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Account, Empty } from '../Card'

const Accounts = ({
  accounts,
  onNewAccount,
  onNewAllocation,
  onManageParameters,
}) => {
  console.log(accounts)
  const accountsEmpty = accounts.length === 0
  const accountsMap = accounts.map(
    ({data}) => (
      <Account
        // TODO: Make this more unique by other id?
        key={data.id}
        proxy={data.proxy}
        balance={data.balance}
        limit={data.limit}
        token={data.token}
        description={data.metadata}
        onNewAllocation={onNewAllocation}
        onManageParameters={onManageParameters}
      />
    )
  )

  if (accountsEmpty) {
    return <Empty action={onNewAccount} />
  }
  return <StyledAccounts>{accountsMap}</StyledAccounts>
}

Accounts.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNewAccount: PropTypes.func.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  onManageParameters: PropTypes.func.isRequired,
}

const StyledAccounts = styled.div`
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-auto-rows: auto;
  grid-gap: 2rem;
  justify-content: start;
  padding: 30px;
`

export default Accounts
