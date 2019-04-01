import { first, map } from 'rxjs/operators' // Make sure observables have .first and .map
//import 'rxjs/add/operator/map' // Make sure observables have .map

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

export const onPayoutExecuted = async (accounts = [], { accountId }) => {
  const index = accounts.findIndex(a => a.accountId === accountId)
  if (index < 0) {
    return onNewAccount(accounts, { accountId })
  } else {
    const nextId = accounts[index].accountId
    accounts[index] = await getAccountById(nextId)
  }
  return accounts
}

/// /////////////////////////////////////
/*    Allocations helper functions    */
/// /////////////////////////////////////

const getAccountById = accountId => {
  return app
    .call('getPayout', accountId)
    .pipe(
      first(),
      map(data => ({ accountId, data, executed: true }))
    )
    .toPromise()
}
