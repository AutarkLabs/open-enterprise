import { combineLatest } from 'rxjs'
import { first, map } from 'rxjs/operators'

import { app } from '../../../../shared/store-utils'

/// /////////////////////////////////////
/*    Allocations event handlers      */
/// /////////////////////////////////////

export const updateAllocations = async (allocations, { accountId, payoutId }) => {
  const newAllocations = Array.from(allocations || [])

  if (!newAllocations.some(a => a.id === payoutId && a.accountId === accountId)) {
    newAllocations.push(await getAllocation({ accountId, payoutId }))
  }
  return newAllocations
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

const getAllocation = async ({ accountId, payoutId }) => {
  return combineLatest(
    app.call('getAccount', accountId),
    app.call('getPayout', accountId, payoutId),
    app.call('getPayoutDescription', accountId, payoutId)
  )
    .pipe(
      first(),
      map(({
        amount,
        description,
        distSet,
        period,
        recurrences,
        startTime,
        token,
      }) => ({
        // transform response data for the frontend
        accountId,
        amount,
        description,
        distSet,
        payoutId,
        period,
        recurrences,
        startTime,
        token,
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
