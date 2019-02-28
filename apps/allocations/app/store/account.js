import { app } from './'

/// /////////////////////////////////////
/*    Allocations event handlers      */
/// /////////////////////////////////////

export const onNewAccount = async (accounts = [], { accountId }) => {
  if (!accounts.some(a => a.accountId === accountId)) {
    const newAccount = await getAccountById(accountId)
    if (newAccount) {
      accounts.push(newAccount)
      // console.log('[Allocations] caching', newAccount.data.metadata, 'account')
    }
  }
  return accounts
}

export const onFundedAccount = async (accounts = [], { accountId }) => {
  const index = accounts.findIndex(a => a.accountId === accountId)
  if (index < 0) {
    return onNewAccount(accounts, { accountId })
  } else {
    const nextId = accounts[index].accountId
    accounts[index] = await getAccountById(nextId)
  }
  return accounts
}

export const syncAccounts = async (accounts = [], { accountId }) => {
  const data = await loadAccountData(accountId) // async load data from contract
  const account = { accountId, data, executed: true } // transform from the frontend to understand
  // console.log('[Allocations script]', accountId, 'updating cache')
  const nextAccounts = [...accounts, account] // add to the state object received as param
  // console.log('[Allocations script] nextAccounts', nextAccounts)

  return nextAccounts
}

/// /////////////////////////////////////
/*    Allocations helper functions    */
/// /////////////////////////////////////

const getAccountById = accountId => {
  return app
    .call('getPayout', accountId)
    .first()
    .map(data => ({ accountId, data, executed: true }))
    .toPromise()
}

const loadAccountData = async accountId => {
  return new Promise(resolve => {
    // TODO: Should we standarize the naming and switch to getAccount instead of getPayout?
    app
      .call('getPayout', accountId)
      .first()
      .map()
      .subscribe(account => {
        // don't resolve when entry not found
        if (account) {
          resolve({
            balance: account[0],
            limit: account[1],
            metadata: account[2],
            token: account[3],
            proxy: account[4],
            amount: account[5],
          })
        }
      })
  })
}
