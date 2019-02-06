import Aragon from '@aragon/client'
import AddressBookJSON from '../../address-book/build/contracts/AddressBook.json'

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
    nextState = await syncEntries(appState, returnValues)
    break
  case 'EntryRemoved':
    nextState = await onRemoveEntry(appState, returnValues)
    break
  default:
    console.log('[Allocations script] Unknown event', response)
  }
  if (nextState !== null) {
    app.cache('state', nextState)
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

// TODO: Maybe import from AddressBook script to D.R.Y.
const onRemoveEntry = async (state, returnValues) => {
  const { entries = [] } = state
  // Try to find the removed entry in the current state
  const entryIndex = entries.findIndex(
    entry => entry.addr === returnValues.addr
  )
  // If the entry exists in the state, remove from it
  if (entryIndex !== -1) {
    entries.splice(entryIndex, 1)
  }
  return state
}

async function syncEntries(state, { addr }) {
  const transform = ({ data, ...entry }) => ({
    ...entry,
    data: { ...data },
  })
  try {
    const updatedState = await updateEntryState(state, addr, transform)
    return updatedState
  } catch (err) {
    console.error('[Allocations script] syncEntries failed', err)
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

const loadEntryData = async addr => {
  return new Promise(resolve => {
    addressBook.getEntry(addr).subscribe(entry => {
      // return gracefully when entry not found
      entry &&
        resolve({
          entryAddress: entry[0],
          name: entry[1],
          entryType: entry[2],
        })
    })
  })
}

async function checkEntriesLoaded(entries, addr, transform) {
  const entryIndex = entries.findIndex(entry => entry.addr === addr)
  if (entryIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    // hopefully every "not_found" entry will be deleted when its EntryRemoved event is handled
    return entries.concat(
      await transform({
        addr,
        data: (await loadEntryData(addr)) || 'not_found',
      })
    )
  } else {
    const nextEntries = Array.from(entries)
    nextEntries[entryIndex] = await transform({
      addr,
      data: await loadEntryData(addr),
    })
    return nextEntries
  }
}

async function updateEntryState(state, addr, transform) {
  const { entries = [] } = state
  try {
    const nextEntries = await checkEntriesLoaded(entries, addr, transform)
    const newState = { ...state, entries: nextEntries }
    return newState
  } catch (err) {
    console.error('[Allocations script] updateEntryState failed', err)
  }
}
