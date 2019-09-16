// import { combineLatest } from 'rxjs'
import { first, map } from 'rxjs/operators'

import { app } from '../../../../shared/store-utils'

/// /////////////////////////////////////
/*    Allocations event handlers      */
/// /////////////////////////////////////

export const updateAccounts = async (accounts, id) => {
  const newAccounts = Array.from(accounts || [])

  if (!newAccounts.some(a => a.accountId === id)) {
    newAccounts.push(await getAccount(id))
  }
  return newAccounts
}

// const onNewPayout = async (payouts = [], { accountId, payoutId }) => {
//   if (
//     !payouts.some(a => a.payoutId === payoutId && a.accountId === accountId)
//   ) {
//     const newPayout = await loadPayoutData(accountId, payoutId)
//     if (newPayout) {
//       payouts.push(newPayout)
//     }
//   }
//   return payouts
// }

// export const onFundedAccount = async (accounts = [], { accountId }) => {
//   const index = accounts.findIndex(a => a.accountId === accountId)
//   if (index < 0) {
//     return onNewAccount(accounts, { accountId })
//   } else {
//     const nextId = accounts[index].accountId
//     accounts[index] = await getAccountById(nextId)
//   }
//   return accounts
// }

// export const onPayoutExecuted = async (
//   payouts = [],
//   accounts = [],
//   { accountId, payoutId }
// ) => {
//   const index = payouts.findIndex(
//     a => a.payoutId === payoutId && a.accountId === accountId
//   )
//   const accountIndex = accounts.findIndex(a => a.accountId === accountId)
//   if (index < 0) {
//     payouts = await onNewPayout(payouts, { accountId, payoutId })
//   } else {
//     payouts[index] = await loadPayoutData(
//       payouts[index].accountId,
//       payouts[index].payoutId
//     )
//   }
//   const nextId = accounts[accountIndex].accountId
//   accounts[accountIndex] = await getAccountById(nextId)
//   return { accounts, payouts }
// }

/// /////////////////////////////////////
/*    Allocations helper functions    */
/// /////////////////////////////////////

const getAccount = id => {
  return app
    .call('getAccount', id)
    .pipe(
      first(),
      map(({ budget, hasBudget, metadata, token }) => ({
        // transform response data for the frontend
        hasBudget,
        id, // note the id is added along with the other data
        token,
        amount: budget,
        name: metadata,
      }))
    )
    .toPromise()
}

// const loadPayoutData = async (accountId, payoutId) => {
//   return new Promise(resolve => {
//     // TODO: Should we standarize the naming and switch to getAccount instead of getPayout?
//     combineLatest(
//       app.call('getPayout', accountId, payoutId),
//       app.call('getAccount', accountId),
//       app.call('getPayoutDescription', accountId, payoutId)
//     )
//       .pipe(first())
//       .subscribe(data => {
//         // don't resolve when entry not found
//         if (data) {
//           resolve({
//             token: data[0].token,
//             amount: data[0].amount,
//             startTime: new Date(data[0].startTime * 1000),
//             recurring: data[0].recurring,
//             period: data[0].period,
//             description: data[2],
//             payoutId: payoutId,
//             distSet: data[0].distSet,
//             accountId: accountId,
//           })
//         }
//       })
//   })
// }
