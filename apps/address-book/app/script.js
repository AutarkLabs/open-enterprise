import Aragon from '@aragon/client'
import { first, of } from 'rxjs' // Make sure observables have .first
import { combineLatest } from 'rxjs'
import { empty } from 'rxjs/observable/empty'

const app = new Aragon()
let appState
app.events().subscribe(handleEvents)

app.state().subscribe(state => {
  console.log('Allocations: entered state subscription:\n', state)
  appState = state ? state : { entries: [] }
  //appState = state
})

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

async function handleEvents(response) {
  let nextState
  switch (response.event) {
  case 'EntryAdded':
    nextState = await syncEntries(appState, response.returnValues)
    break
  case 'EntryRemoved':
    console.log('EntryRemoved Fired: ', response.returnValues)
    nextState = await syncEntries(appState, response.returnValues)
    break
  default:
    console.log(response)
  }
  app.cache('state', nextState)
}

async function syncEntries(state, { addr, ...eventArgs }) {
  console.log('arguments from events:', ...eventArgs)
  const transform = ({ data, ...entry }) => ({
    ...entry,
    data: { ...data },
  })
  try {
    let updatedState = await updateState(state, addr, transform)
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

function loadEntryData(addr) {
  console.log('loadEntryData entered')
  return new Promise(resolve => {
    combineLatest(app.call('getEntry', addr)).subscribe(
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

async function updateState(state, addr, transform) {
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
