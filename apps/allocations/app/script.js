import Aragon, {providers} from '@aragon/client'
import { first, of } from 'rxjs' // Make sure observables have .first
import { combineLatest } from 'rxjs'
import { empty } from 'rxjs/observable/empty'

const app = new Aragon()
let appState
app.events().subscribe(handleEvents)

app.state().subscribe( (state) => {
  console.log(
    'entered state subscription:\n',
    state
  )
  appState = state ? state : {accounts:[]}
  //appState = state
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
    nextState = await newAccount(appState, response.returnValues)
    break
  case 'FundAccount':
    console.log('FundAccount Fired: ', response.returnValues)
    nextState = await newAccount(appState, response.returnValues)
    break
  }
  app.cache('state', nextState)
}


async function newAccount(state, { accountId, ...eventArgs }) {
  console.log('arguments from events:', ...eventArgs)
  const transform = ({ data, ...account }) => ({
    ...account,
    data: { ...data, executed: true },
  })
  try {
    let updatedState = await updateState(state, accountId, transform)
    return updatedState
  }
  catch(err) {
    console.error(
      'updateState failed to return:',
      err,
    )
  }
}

async function updateAccountBalance(state, { accountId, balance}) {
  const transform = ({ data, ...account }) => ({
    ...account,
    data: { ...data, executed: true },
  })
  try {
    let updatedState = await updateState(state, accountId, transform)
    return updatedState
  }
  catch(err) {
    console.error(
      'updateState failed to return:',
      err,
    )
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

function loadAccountData(accountId) {
  console.log('loadAccountData entered')
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
    console.log('account not found: retrieving from chain')
    return accounts.concat(
      await transform({
        accountId,
        data: await loadAccountData(accountId),
      })
    )
  } else {
    const nextAccounts = Array.from(accounts)
    nextAccounts[accountIndex] = await transform({
      accountId,
      data: await loadAccountData(accountId),
    })
    return nextAccounts
  }
}

async function updateState(state, accountId, transform) {
  const { accounts = [] } = state
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
