import Aragon from '@aragon/api'

const app = new Aragon()
let appState
app.events().subscribe(handleEvents)

app.state().subscribe(state => {
  appState = state ? state : { entries: [] }
})

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function handleEvents({ event, returnValues }) {
  let nextState
  switch (event) {
  case 'EntryAdded':
    nextState = await onEntryAdded(appState, returnValues)
    break
  case 'EntryRemoved':
    nextState = await onEntryRemoved(appState, returnValues)
    break
  default:
    nextState = appState || { entries: [] }
    console.log('[AddressBook script] unknown event', event, returnValues)
  }
  // purify the resulting state to handle duplication edge cases
  const filteredState = { entries: filterEntries(nextState.entries) }
  app.cache('state', filteredState)
}

const onEntryAdded = async ({ entries = [] }, { addr }) => {
  // is addr already in the state?
  if (entries.some(entry => entry.addr === addr)) {
    // entry already cached, do nothing
    console.log('[AddressBook script]', addr, 'already cached')
  } else {
    // entry not cached
    const data = await loadEntryData(addr) // async load data from contract
    const entry = { addr, data } // transform for the frontend to understand
    entries.push(entry) // add to the state object received as param
    console.log('[AddressBook script] caching new contract entry', data.name)
    // console.log('[AddressBook script] at position', addedIndex) // in case we need the index
  }
  const state = { entries } // return the (un)modified entries array
  return state
}

const onEntryRemoved = async ({ entries = [] }, { addr }) => {
  const removeIndex = entries.findIndex(entry => entry.addr === addr)
  if (removeIndex > -1) {
    // entry already cached, remove from state
    console.log('[AddressBook script] removing', addr.name, 'cached copy')
    entries.splice(removeIndex, 1)
  }

  const state = { entries } // return the (un)modified entries array
  return state
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

const loadEntryData = async addr => {
  return new Promise(resolve => {
    app.call('getEntry', addr).subscribe(entry => {
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

// Remove possible duplications and enforce state integration to follow smart contract rules
// Currently is: unique addresses, unique names
// TODO: Integrate validators in the frontend inputs to feedback the user about those rules
export const filterEntries = entries => {
  // use set to filter unique https://stackoverflow.com/q/39885893
  const filtered = entries
    .filter((set => e => !set.has(e.addr) && set.add(e.addr))(new Set()))
    .filter(
      (set => e => !set.has(e.data.name) && set.add(e.data.name))(new Set())
    )

  return filtered
}
