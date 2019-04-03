import { of } from 'rxjs'
import { pluck } from 'rxjs/operators'

import vaultAbi from '../../../shared/json-abis/vault'
import { app, handleEvent, INITIAL_STATE } from './'
import { INITIALIZE_STORE } from './eventTypes'

const github = () => {
  return app.rpc
    .sendAndObserveResponses('cache', [ 'get', 'github' ])
    .pipe(pluck('result'))
}

export const initStore = (vaultAddress, network) => {
  const vaultContract = app.external(vaultAddress, vaultAbi)
  return app.store(
    async (state, event) => {
      try {
        const nextState = await handleEvent(state, event)
        return nextState
      } catch (err) {
        console.error(`[PROJECTS] store error:
        event: ${JSON.stringify(event.event, null, 4)}
        state: ${JSON.stringify(err, null, 4)}
        `)
      }
      // always return the state even unmodified
      return state
    },
    [
      // Always initialize the store with our own home-made event
      of({ event: INITIALIZE_STORE }),
      github(),
      // handle vault events
      vaultContract.events(),
    ]
  )
}
