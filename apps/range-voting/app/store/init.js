import AddressBookJSON from '../../../shared/json-abis/address-book.json'
import { app, handleEvent, INITIALIZATION_TRIGGER } from './'
import { of } from './rxjs'

export const initStore = addressBookAddress => {
  const addressBookApp = app.external(addressBookAddress, AddressBookJSON.abi)

  const initialState = {
    votes: [],
    entries: [],
  }
  return app.store(
    async (state, event) => {
      // ensure there are initial placeholder values
      if (!state) state = initialState

      try {
        const next = await handleEvent(state, event, {
          addressBook: {
            address: addressBookAddress,
            contract: addressBookApp,
          },
        })
        const nextState = { ...initialState, ...next }
        // Debug point
        return nextState
      } catch (err) {
        console.error('[Range Voting script] initStore', event, err)
      }
      // always return the state even unmodified
      return state
    },
    [
      of({ event: INITIALIZATION_TRIGGER }),
      // handle address book events
      addressBookApp.events(),
    ]
  )
}
