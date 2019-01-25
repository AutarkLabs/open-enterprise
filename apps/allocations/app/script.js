import Aragon from '@aragon/client'
import { first, of } from 'rxjs' // Make sure observables have .first
import { combineLatest } from 'rxjs'
import AddressBookJSON from '../../address-book/build/contracts/AddressBook.json'
import { empty } from 'rxjs/observable/empty'

const app = new Aragon()
let appState
let addressBook
app.events().subscribe(handleEvents)

app.state().subscribe(state => {
  console.log('Allocations: entered state subscription:\n', state)
  appState = state ? state : { accounts: [], entries: [] }
  //appState = state
  if(!addressBook){
    // this should be refactored to be a "setting"
    app.call('addressBook').subscribe(
      (response) => {
        addressBook = app.external(response, AddressBookJSON.abi)
        addressBook.events().subscribe(handleEvents)
      }
    )
  }
})

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function handleEvents(response) {
  let nextState = null
  switch (response.event) {
  case 'PayoutExecuted':
  case 'NewAccount':
    nextState = await syncAccounts(appState, response.returnValues)
    break
  case 'FundAccount':
    console.log('FundAccount Fired: ', response.returnValues)
    nextState = await syncAccounts(appState, response.returnValues)
    break
  case 'SetDistribution':
    nextState = await syncAccounts(appState, response.returnValues)
    break
  case 'EntryAdded':
    console.log('EntryAdded Fired: ', response.returnValues)
    nextState = await syncEntries(appState, response.returnValues)
    break
  case 'EntryRemoved':
    console.log('EntryRemoved Fired: ', response.returnValues)
    nextState = await syncEntries(appState, response.returnValues)
    break  
  default:
    console.log(response)
  }
  if(nextState !== null) {
    app.cache('state', nextState)
  }
}

async function syncAccounts(state, { accountId, ...eventArgs }) {
  console.log('arguments from events:', ...eventArgs)
  const transform = ({ data, ...account }) => ({
    ...account,
    data: { ...data, executed: true },
  })
  try {
    let updatedState = await updateAllocationState(state, accountId, transform)
    return updatedState
  } catch (err) {
    console.error('updateState failed to return:', err)
  }
}

async function syncEntries(state, { addr, ...eventArgs }) {
  console.log('arguments from events:', ...eventArgs)
  const transform = ({ data, ...entry }) => ({
    ...entry,
    data: { ...data },
  })
  try {
    let updatedState = await updateEntryState(state, addr, transform)
    return updatedState
  } catch (err) {
    console.error('updateState failed to return:', err)
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

async function checkAccountsLoaded(accounts, accountId, transform) {
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

async function updateAllocationState(state, accountId, transform) {
  const { accounts = [] } = state
  try {
    let newAccounts = await checkAccountsLoaded(accounts, accountId, transform)
    let newState = { ...state, accounts: newAccounts }
    return newState
  } catch (err) {
    console.error(
      'Update accounts failed to return:',
      err,
      'here\'s what returned in NewAccounts',
      newAccounts
    )
  }
}


function loadEntryData(addr) {
  console.log('loadEntryData entered')
  return new Promise(resolve => {
    combineLatest(addressBook.getEntry(addr)).subscribe(
      ( [entry]) => {
        console.log(entry)
        resolve({
          entryAddress: entry[0],
          name: entry[1],
          entryType: entry[2]
        })
      }
    )
  })
}

async function checkEntriesLoaded(entries, addr, transform) {
  console.log('Check Entries Loaded')
  const entryIndex = entries.findIndex(
    entry => entry.addr === addr
  )
  if (entryIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    console.log('entry not found: retrieving from chain')
    return entries.concat(
      await transform({
        addr,
        data: await loadEntryData(addr),
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
    let nextEntries = await checkEntriesLoaded(entries, addr, transform)
    let newState = { ...state, entries: nextEntries }
    return newState
  } catch (err) {
    console.error(
      'Update entries failed to return:',
      err,
      'here\'s what returned in NewEntries',
      nextEntries
    )
  }
}