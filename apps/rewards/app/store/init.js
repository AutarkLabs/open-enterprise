import vaultAbi from '../../../shared/json-abis/vault'
import { app, handleEvent, INITIALIZATION_TRIGGER } from './'
import { ETHER_TOKEN_FAKE_ADDRESS } from '../utils/token-utils'
import { of } from 'rxjs'
import { pluck } from 'rxjs/operators'

const rewardsRefreshRequests = () => {
  return app.rpc
    .sendAndObserveResponses('cache', [ 'get', 'requestRefresh' ])
    .pipe(pluck('result'))
}

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
        const nextState = { ...initialState, ...next }
        // Debug point
        return nextState
      } catch (err) {
        console.error('[Rewards script] initStore', event, err)
      }
      return state
    },
    [
      // Always initialize the store with our own home-made event
      of({ event: INITIALIZATION_TRIGGER }),
      rewardsRefreshRequests(),
      // handle vault events
      vaultContract.events(),
    ]
  )
}
