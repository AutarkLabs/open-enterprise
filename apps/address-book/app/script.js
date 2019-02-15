import Aragon from '@aragon/client'

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
    console.log('[AddressBook script] Unknown event', response)
  }
  app.cache('state', nextState)
}

export const onEntryAdded = async ({ entries = [] }, { addr }) => {
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

export const onEntryRemoved = async ({ entries = [] }, { addr }) => {
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

async function updateState(state, addr, transform) {
  const { entries = [] } = state
  try {
    const nextEntries = await checkEntriesLoaded(entries, addr, transform)
    const newState = { ...state, entries: nextEntries }
    return newState
  } catch (err) {
    console.error('[AddressBook script] updateState failed', err)
  }
}
