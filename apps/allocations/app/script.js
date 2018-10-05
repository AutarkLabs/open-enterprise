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
  console.log(nextState)
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
        console.log(account)
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


  /**
   * Listens for events, passes them through `reducer`, caches the resulting state
   * and returns that state.
   *
   * The reducer takes the signature `(state, event)` a lá Redux.
   *
   * Optionally takes an array of other web3 event observables to merge with this app's events
   *
   * @memberof AppProxy
   * @param  {reducer}      reducer
   * @param  {Observable[]} [events]
   * @return {Observable}   An observable of the resulting state from reducing events
   */
  function store (reducer, events = [empty()]) {
    console.log("first" + app.state().first())
    const initialState = app.state().first()

    // Wrap the reducer in another reducer that
    // allows us to execute code asynchronously
    // in our reducer. That's a lot of reducing.
    //
    // This is needed for the `mergeScan` operator.
    // Also, this supports both sync and async code
    // (because of the `Promise.resolve`).
    const wrappedReducer = (state, event) =>
      fromPromise(
        Promise.resolve(reducer(state, event))
      )
      console.log("wrappedReducer")
    const store$ = initialState
      .switchMap((initialState) =>
        merge(
          app.events(),
          ...events
        )
          .mergeScan(wrappedReducer, initialState, 1)
          .map((state) => app.cache('state', state))
      )
      .publishReplay(1)
    console.log("store")
    store$.connect()
    console.log("connect")
    return store$
  }