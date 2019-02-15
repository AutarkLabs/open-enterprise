import Aragon from '@aragon/client'
import AddressBookJSON from '../../address-book/build/contracts/AddressBook.json'
import { filterEntries } from '../../address-book/app/script'

const app = new Aragon()
let appState, addressBook
app.events().subscribe(handleEvents)

app.state().subscribe(state => {
  appState = state ? state : { accounts: [], entries: [] }
  if (!addressBook) {
    // this should be refactored to be a "setting"
    app.call('addressBook').subscribe(response => {
      addressBook = app.external(response, AddressBookJSON.abi)
      addressBook.events().subscribe(handleEvents)
    })
  }
})

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function handleEvents({ event, returnValues }) {
  let nextState = null
  switch (event) {
  case 'PayoutExecuted':
  case 'NewAccount':
    nextState = await syncAccounts(appState, returnValues)
    break
  case 'FundAccount':
    nextState = await syncAccounts(appState, returnValues)
    break
  case 'SetDistribution':
    nextState = await syncAccounts(appState, returnValues)
    break
  case 'EntryAdded':
    nextState = await onEntryAdded(appState, returnValues)
    break
  case 'EntryRemoved':
    nextState = await onEntryRemoved(appState, returnValues)
    break
  default:
    console.log('[Allocations script] Unknown event', response)
  }
  if (nextState !== null) {
    const { accounts, entries } = nextState
    const filteredState = { accounts, entries: filterEntries(entries) }
    app.cache('state', filteredState)
  }
}

async function syncAccounts(state, { accountId }) {
  const transform = ({ data, ...account }) => ({
    ...account,
    data: { ...data, executed: true },
  })
  try {
    const updatedState = await updateAllocationState(
      state,
      accountId,
      transform
    )
    return updatedState
  } catch (err) {
    console.error('[Allocations script] syncAccounts failed', err)
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

function loadAccountData(accountId) {
  return new Promise(resolve => {
    app.call('getPayout', accountId).subscribe(
      // TODO: do something with metadata param or remove it
      (account, _metadata) => {
        resolve(account)
      }
    )
  })
}

async function checkAccountsLoaded(accounts, accountId, transform) {
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
    nextAccounts[accountIndex] = await transform({
      accountId,
      data: await loadAccountData(accountId),
    })
    return nextAccounts
  }
}

async function updateAllocationState(state, accountId, transform) {
  const { accounts = [] } = state
  try {
    const newAccounts = await checkAccountsLoaded(
      accounts,
      accountId,
      transform
    )
    const newState = { ...state, accounts: newAccounts }
    return newState
  } catch (err) {
    console.error('[Allocations script] updateAllocationState failed', err)
  }
}

/** AddressBook management */
const onEntryAdded = async ({ entries = [] }, { addr }) => {
  // is addr already in the state?
  if (entries.some(entry => entry.addr === addr)) {
    // entry already cached, do nothing
    console.log('[Allocations script]', addr, 'already cached')
  } else {
    // entry not cached
    const data = await loadEntryData(addr) // async load data from contract
    const entry = { addr, data } // transform for the frontend to understand
    entries.push(entry) // add to the state object received as param
    console.log('[Allocations script] caching new contract entry', data.name)
    // console.log('[AddressBook script] at position', addedIndex) // in case we need the index
  }
  const state = { entries } // return the (un)modified entries array
  return state
}

const onEntryRemoved = async ({ entries = [] }, { addr }) => {
  const removeIndex = entries.findIndex(entry => entry.addr === addr)
  if (removeIndex > -1) {
    // entry already cached, remove from state
    console.log('[Allocations script] removing', addr.name, 'cached copy')
    entries.splice(removeIndex, 1)
  }

  const state = { entries } // return the (un)modified entries array
  return state
}
/***********************
 *     AddressBook     *
 *       Helpers       *
 ***********************/
const loadEntryData = async addr => {
  return new Promise(resolve => {
    // this is why we cannot import methods without binding proxy caller
    addressBook.getEntry(addr).subscribe(entry => {
      // don't resolve when entry not found
      entry &&
        resolve({
          entryAddress: entry[0],
          name: entry[1],
          entryType: entry[2],
        })
    })
  })
}
