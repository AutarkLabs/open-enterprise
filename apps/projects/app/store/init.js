import { of } from 'rxjs'

import vaultAbi from '../../../shared/json-abis/vault'
import { app, handleEvent } from './'
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
        console.error(`[PROJECTS] store error: ${err}
        event: ${JSON.stringify(event.event, null, 4)}
        state: ${JSON.stringify(state, null, 4)}
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
