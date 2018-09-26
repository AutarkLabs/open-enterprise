import Aragon from '@aragon/client'
import { first } from 'rxjs' // Make sure observables have .first
import { combineLatest } from 'rxjs'

const app = new Aragon()

// Hook up the script as an aragon.js store
app.store(async (state, { event, returnValues }) => {
  let nextState = {
    ...state,
    // Fetch the app's settings, if we haven't already
    //...(!hasLoadedVoteSettings(state) ? await loadVoteSettings() : {}),
  }

  switch (event) {
  case 'NewAccount':
    nextState = await newAccount(nextState, returnValues)
    break
  }

  return nextState
})

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function newAccount(state, { accountId }) {
  const transform = ({ data, ...account }) => ({
    ...account,
    data: { ...data, executed: true },
  })
  return updateState(state, accountId, transform)
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

function loadAccountData(accountId) {
  return new Promise(resolve => {
    combineLatest(app.call('getPayout', accountId)).subscribe(
      ([account, metadata]) => {
        resolve(account)
      }
    )
  })
}

async function updateAccounts(accounts, accountId, transform) {
  const accountIndex = accounts.findIndex(
    account => account.accountId === accountId
  )

  if (accountIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    return accounts.concat(
      await transform({
        accountId,
        data: await loadAccountData(accountId),
      })
    )
  } else {
    const nextAccounts = Array.from(accounts)
    nextAccounts[accountIndex] = await transform(nextAccounts[accountIndex])
    return nextAccounts
  }
}

async function updateState(state, accountId, transform) {
  const { accounts = [] } = state

  return {
    ...state,
    accounts: await updateAccounts(accounts, accountId, transform),
  }
}

// Apply transmations to a vote received from web3
// Note: ignores the 'open' field as we calculate that locally
//
