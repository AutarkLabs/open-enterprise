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
    nextState = await syncEntries(appState, returnValues)
    break
  case 'EntryRemoved':
    nextState = await onRemoveEntry(appState, returnValues)
    break
  default:
    console.log('[AddressBook script] Unknown event', response)
  }
  app.cache('state', nextState)
}

const onRemoveEntry = async (state, { addr }) => {
  const { entries = [] } = state
  // Try to find the removed entry in the current state
  const entryIndex = entries.findIndex(entry => entry.addr === addr)
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
    const updatedState = await updateState(state, addr, transform)
    return updatedState
  } catch (err) {
    console.error('[AddressBook script] syncEntries failed', err)
  }
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
