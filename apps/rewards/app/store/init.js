import vaultAbi from '../../../shared/json-abis/vault'
import { app, handleEvent } from './'
import { ETHER_TOKEN_FAKE_ADDRESS } from '../utils/token-utils'
import { of } from 'rxjs'
import { pluck } from 'rxjs/operators'

export const initStore = (vaultAddress, network) => {
  const vaultContract = app.external(vaultAddress, vaultAbi.abi)

  return app.store(
    async (state, event) => {
      // ensure there are initial placeholder values
      let initialState = { ...state }
      console.log(event)
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
        const nextState = { ...initialState, ...next }
        // Debug point
        return nextState
      } catch (err) {
        console.error('[Rewards script] initStore', event, err)
      }
      return state
    },
    { 
      externals: [
        {
          contract: vaultContract,
        },
      ],
      //init: intiState(settings),
    }
  )
}
