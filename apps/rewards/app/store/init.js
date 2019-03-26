import vaultAbi from '../../../shared/json-abis/vault'
import { app, handleEvent, INITIALIZATION_TRIGGER } from './'
import { ETHER_TOKEN_FAKE_ADDRESS } from '../utils/token-utils'
import { of } from './rxjs'

export const initStore = (vaultAddress, network) => {
  const vaultContract = app.external(vaultAddress, vaultAbi.abi)

  return app.store(
    async (state, event) => {
      // ensure there are initial placeholder values
      let initialState = { ...state }

      try {
        const next = await handleEvent(state, event, {
          network,
          vault: {
            address: vaultAddress,
            contract: vaultContract,
          },
          ethToken: {
            address: ETHER_TOKEN_FAKE_ADDRESS,
          },
        })
        //console.log('initial state: ', initialState,'next: ', next)
        const nextState = { ...initialState, ...next }
        // Debug point
        //console.log('[Rewards store]', nextState)
        return nextState
      } catch (err) {
        console.error('[Rewards script] initStore', event, err)
      }
      // always return the state even unmodified
      return state
    },
    [
      // Always initialize the store with our own home-made event
      of({ event: INITIALIZATION_TRIGGER }),

      // handle vault events
      vaultContract.events(),
    ]
  )
}
