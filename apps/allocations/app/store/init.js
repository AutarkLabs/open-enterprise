import vaultAbi from '../../../shared/json-abis/vault'
import AddressBookJSON from '../../../shared/json-abis/address-book.json'
import { ETHER_TOKEN_FAKE_ADDRESS } from '../utils/token-utils'
import { app, handleEvent, INITIALIZATION_TRIGGER } from './'
import { of } from './rxjs'


export const initStore = (vaultAddress, network, addressBookAddress) => {
  const addressBookApp = app.external(addressBookAddress, AddressBookJSON.abi)
  const vaultContract = app.external(vaultAddress, vaultAbi.abi)

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
        const next = await handleEvent(state, event,
          {
            network,
            vault: {
              address: vaultAddress,
              contract: vaultContract,
            },
            ethToken: {
              address: ETHER_TOKEN_FAKE_ADDRESS,
            },
            addressBook: {
              address: addressBookAddress,
              contract: addressBookApp
            }
          })
        const nextState = { ...initialState, ...next }
        // Debug point
        return nextState
      } catch (err) {
        console.error('[Allocations script] initStore', event, err)
      }
      // always return the state even unmodified
      return state
    },
    [
      of({ event: INITIALIZATION_TRIGGER }),
      // handle address book events
      addressBookApp.events(),
      vaultContract.events(),
    ]
  )
}
