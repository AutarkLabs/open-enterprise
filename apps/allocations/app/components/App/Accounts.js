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
  const accountsEmpty = accounts.length === 0
  const accountsMap = accounts.map(
    ({ address, balance, description, limit, token }, id) => (
      <Account
        // TODO: Make this more unique by other id?
        key={id}
        address={address}
        balance={balance}
        limit={limit}
        token={token}
        description={description}
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
