import Aragon, {providers} from '@aragon/client'
import { first, of } from 'rxjs' // Make sure observables have .first
import { combineLatest } from 'rxjs'
import { empty } from 'rxjs/observable/empty'

/***********************
 *                     *
 *  recursive retry    *
 *                     *
 ***********************/

const retryEvery = (callback, initialRetryTimer = 1000, increaseFactor = 5) => {
  const attempt = (retryTimer = initialRetryTimer) => {
    // eslint-disable-next-line standard/no-callback-literal
    callback(() => {
      console.error(`Retrying in ${retryTimer / 1000}s...`)

      // Exponentially backoff attempts
      setTimeout(() => attempt(retryTimer * increaseFactor), retryTimer)
    })
  }
  attempt()
}



const app = new Aragon()
let appState
retryEvery(retry => {
  app
    .events()
    .subscribe(handleEvents, err => {
      console.error(
        'Could not start background script execution due to the contract not loading events:',
        err
      )
      retry()
    })
})
app.state().subscribe( (state) => {
  appState = state
})


/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function handleEvents(response){
  let nextState
  switch (response.event) {
  case 'NewAccount':
    console.log('NewAccount event Fired')
    nextState = await newAccount(appState, response.returnValues)
    break
  }
  app.cache('state', nextState)
}


async function newAccount(state, { accountId }) {
  const transform = ({ data, ...account }) => ({
    ...account,
    data: { ...data, executed: true },
  })
  try {
    console.log('Hi from inside NewAccount')
    let updatedState = await updateState(state, accountId, transform)
    return updatedState
  }
  catch(err) {
    console.error(
      'updateState failed to return:',
      err,
      'Here\'s what returned:'
      //updatedState
    )
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

function loadAccountData(accountId) {
  console.log('Hi from inside loadAccountData')
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
  console.log('Hi from inside UpdateAccounts')
  if (accountIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    console.log('ooo account not found')
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
  console.log('Hi from inside UpdateState')
  try {
    let newAccounts = await updateAccounts(accounts, accountId, transform)
    let newState = {...state, accounts: newAccounts}
    return newState
  }
  catch(err) {
    console.error(
      'Update accounts failed to return:',
      err,
      'here\'s what returned in NewAccounts',
      newAccounts
    )
  }
}
