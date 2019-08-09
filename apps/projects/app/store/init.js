import { of } from 'rxjs'
import { pluck } from 'rxjs/operators'

import vaultAbi from '../../../shared/json-abis/vault'
import { app, handleEvent } from './'
import { initializeTokens, initializeGraphQLClient } from './helpers'
import { INITIAL_STATE } from './'
import { INITIALIZE_STORE, INITIALIZE_VAULT } from './eventTypes'

export const initStore = vaultAddress => {
  const vaultContract = app.external(vaultAddress, vaultAbi.abi)
  return app.store(
    async (state, action) => {
      try {
        const nextState = await handleEvent(state, action, vaultAddress, vaultContract)
        return nextState
      } catch (err) {
        console.error(
          `[PROJECTS] store error: ${err}
          event: ${JSON.stringify(action.event, null, 4)}
          state: ${JSON.stringify(state, null, 4)}`
        )
      }
      // always return the state even unmodified
      return state
    },
    {
      externals: [
        // handle vault events
        { contract: vaultContract },
      ],
      init: initState(vaultContract),
    }
  )
}

const initState = (vaultContract) => async (cachedState) => {
  const github = await app.getCache().toPromise()
  if (github) {
    initializeGraphQLClient(github.token)
  }

  const nextState = await initializeTokens(cachedState, vaultContract)
  return nextState
}
