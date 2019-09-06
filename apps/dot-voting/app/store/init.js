import ContactsJSON from '../../../shared/json-abis/contacts.json'
import { app, handleEvent } from './'

export const initStore = contactsAddress => {
  const contactsApp = app.external(contactsAddress, ContactsJSON.abi)

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
          contacts: {
            address: contactsAddress,
            contract: contactsApp,
          },
        })
        const nextState = { ...initialState, ...next }
        // Debug point
        return nextState
      } catch (err) {
        console.error('[Dot Voting script] initStore', event, err)
      }
      // always return the state even unmodified
      return state
    },
    {
      externals: [
        {
          contract: contactsApp
        }
      ]
    }
  )
}
