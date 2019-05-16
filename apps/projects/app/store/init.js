import { of } from 'rxjs'

import { pluck } from 'rxjs/operators'

import vaultAbi from '../../../shared/json-abis/vault'
import { app, handleEvent } from './'
import { INITIALIZE_STORE, INITIALIZE_VAULT } from './eventTypes'

const github = () => {
  return app.rpc
    .sendAndObserveResponses('cache', [ 'get', 'github' ])
    .pipe(pluck('result'))
}

export const initStore = (vaultAddress, network) => {
  const vaultContract = app.external(vaultAddress, vaultAbi.abi)
  return app.store(
    async (state, action) => {
      try {
        const nextState = await handleEvent(state, action, vaultAddress, vaultContract)
        return nextState
      } catch (err) {
        console.error(`[PROJECTS] store error: ${err}
        event: ${JSON.stringify(action.event, null, 4)}
        state: ${JSON.stringify(state, null, 4)}
        `)
      }
      // always return the state even unmodified
      return state
    },
    [
      // Always initialize the store with our own home-made event
      of({ event: INITIALIZE_STORE }),
      of({ event: INITIALIZE_VAULT }),
      github(),
      // handle vault events
      vaultContract.events(),
    ]
  )
}
