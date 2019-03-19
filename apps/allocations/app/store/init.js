import addressBookAbi from '../../../shared/json-abis/address-book'
import { app, handleEvent } from './'

export const initStore = addressBookAddress => {
  const addressBookApp = app.external(addressBookAddress, addressBookAbi)

  const initialState = {
    accounts: [],
    entries: [],
    addressBook: addressBookAddress,
  }

  return app.store(
    async (state, event) => {
      // ensure there are initial placeholder values
      if (!state) state = initialState

      try {
        const next = await handleEvent(state, event)
        const nextState = { ...initialState, ...next }
        // Debug point
        console.log('[Allocations store]', nextState)
        return nextState
      } catch (err) {
        console.error('[Allocations script] initStore', event, err)
      }
      // always return the state even unmodified
      return state
    },
    [
      // handle address book events
      addressBookApp.events(),
    ]
  )
}
