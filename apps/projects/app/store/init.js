import vaultAbi from '../../../shared/json-abis/vault'
import { app, handleEvent, INITIALIZATION_TRIGGER, INITIAL_STATE } from './'
import { of } from 'rxjs'
import { pluck } from 'rxjs/operators'

const github = () => {
  return app.rpc
    .sendAndObserveResponses('cache', [ 'get', 'github' ])
    .pipe(pluck('result'))
}

export const initStore = (vaultAddress, network) => {
  const vaultContract = app.external(vaultAddress, vaultAbi)
  console.log('INITING THE STORE')
  return app.store(
    async (state, event) => {
      console.dir(`[PROJECTS] BEFORE STATE UPDATE:
      event: ${JSON.stringify(event, null, 4)}
      state: ${JSON.stringify(state, null, 4)}
      `)

      try {
        const nextState = await handleEvent(state, event)
        // Debug point
        //console.log('[Rewards store]', nextState)
        console.dir(`[PROJECTS] AFTER SUCCESSFUL STATE UPDATE:
        event: ${JSON.stringify(event.event, null, 4)}
        state: ${JSON.stringify(nextState, null, 4)}
        `)
        return nextState
      } catch (err) {
        console.error(`[PROJECTS] store error:
        event: ${JSON.stringify(event, null, 4)}
        state: ${JSON.stringify(err, null, 4)}
        `)
      }
      // always return the state even unmodified
      return state
    },
    [
      // Always initialize the store with our own home-made event
      of({ event: INITIALIZATION_TRIGGER }),
      github(),
      // handle vault events
      vaultContract.events(),
    ]
  )
}
