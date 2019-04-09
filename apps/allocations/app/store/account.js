import { first, map } from 'rxjs/operators' // Make sure observables have .first and .map
//import 'rxjs/add/operator/map' // Make sure observables have .map

import { app } from './'
import { combineLatest } from '../rxjs'

/// /////////////////////////////////////
/*    Allocations event handlers      */
/// /////////////////////////////////////

export const onNewAccount = async (accounts = [], { accountId }) => {
  if (!accounts.some(a => a.accountId === accountId)) {
    const newAccount = await getAccountById(accountId)
    if (newAccount) {
      accounts.push(newAccount)
    }
  }
  return accounts
}

export const onNewPayout = async (payouts = [], { accountId, payoutId }) => {
  if (!payouts.some(a => a.payoutId === payoutId && a.accountId === accountId)) {
    const newPayout = await loadPayoutData(accountId, payoutId)
    if (newPayout) {
      payouts.push(newPayout)
    }
  }
  console.log('onNewPayout', payouts)
  return payouts
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

export const onPayoutExecuted = async (payouts = [], accounts = [], { accountId, payoutId }) => {
  const index = payouts.findIndex(a => a.payoutId === payoutId && a.accountId === accountId)
  const accountIndex = accounts.findIndex(a => a.accountId === accountId)
  if (index < 0) {
    payouts = await onNewPayout(payouts, { accountId, payoutId })
  } else {
    payouts[index] = await loadPayoutData(payouts[index].accountId, payouts[index].payoutId)
  }
  const nextId = accounts[accountIndex].accountId
  accounts[accountIndex] = await getAccountById(nextId)
  return { payouts: payouts, accounts: accounts }
}

/// /////////////////////////////////////
/*    Allocations helper functions    */
/// /////////////////////////////////////

const getAccountById = accountId => {
  return app
    .call('getAccount', accountId)
    .pipe(
      first(),
      map(data => ({ accountId, data, executed: true }))
    )
    .toPromise()
}

const loadPayoutData = async (accountId, payoutId) => {
  return new Promise(resolve => {
    // TODO: Should we standarize the naming and switch to getAccount instead of getPayout?
    combineLatest(
      app.call('getPayout', accountId, payoutId),
      app.call('getAccount', accountId),
      app.call('getPayoutDescription', accountId, payoutId),
    )
      .pipe(first())
      .subscribe(data => {
        // don't resolve when entry not found
        console.log('loadPayoutData', data)

        if (data) {
          resolve({
            token: data[0].token,
            amount: data[0].amount,
            startTime: new Date(data[0].startTime * 1000),
            recurring: data[0].recurring,
            period: data[0].period,
            description: data[2],
            payoutId: payoutId,
            distSet: data[0].distSet,
            accountId: accountId,
          })
        }
      })
  })
}
