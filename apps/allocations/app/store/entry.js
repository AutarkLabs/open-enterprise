import addressBookAbi from '../../../shared/abi/address-book'
import { app } from './'

/// /////////////////////////////////////
/*     AddressBook event handlers      */
/// /////////////////////////////////////

export const onEntryAdded = async ({ entries = [], addressBook }, { addr }) => {
  // is addr already in the state?
  if (entries.some(entry => entry.addr === addr)) {
    // entry already cached, do nothing
  } else {
    // entry not cached
    const data = await loadEntryData(addr, addressBook) // async load data from contract
    const entry = { addr, data } // transform for the frontend to understand
    entries.push(entry) // add to the state object received as param
  }
  // return the (un)modified entries array
  return entries
}

export const onEntryRemoved = async ({ entries }, { addr }) => {
  const removeIndex = entries.findIndex(entry => entry.addr === addr)
  if (removeIndex > -1) {
    // entry already cached, remove from state
    entries.splice(removeIndex, 1)
  }
  // return the (un)modified entries array
  return entries
}

/// /////////////////////////////////////
/*    AddressBook helper functions    */
/// /////////////////////////////////////

const loadEntryData = async (addr, addressBook) => {
  const addressBookApp = app.external(addressBook, addressBookAbi)

  return addressBookApp
    .getEntry(addr)
    .first()
    .map(
      entry =>
        // cover removed entries
        entry === undefined
          ? 'removed'
          : {
            entryAddress: entry[0],
            name: entry[1],
            entryType: entry[2],
          }
    )
    .toPromise()
}
