import Aragon, {providers} from '@aragon/client'
import { first, of } from 'rxjs' // Make sure observables have .first
import { combineLatest } from 'rxjs'
import { empty } from 'rxjs/observable/empty'


const app = new Aragon()
let appState
app.events().subscribe(handleEvents)
app.state().subscribe( (state) => {
  appState = state
})

async function handleEvents(response){
  let nextState
  switch (response.event) {
  case 'NewAccount':
    nextState = await newAccount(appState, response.returnValues)
    break
  }
  app.cache('state', nextState)
}


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
