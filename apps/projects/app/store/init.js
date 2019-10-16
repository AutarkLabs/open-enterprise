import vaultAbi from '../../../shared/json-abis/vault'
import standardBounties from '../abi/StandardBounties.json'
import { app, handleEvent, INITIAL_STATE } from './'
import { initializeTokens, initializeGraphQLClient } from './helpers'


export const initStore = (vaultAddress, standardBountiesAddress) => {

  const vaultContract = app.external(vaultAddress, vaultAbi.abi)
  const standardBountiesContract = app.external(standardBountiesAddress, standardBounties.abi)
  return app.store(
    async (state, action) => {
      try {
        /*
          Since new events have fired, we know that the next state
          passed to the front end is not from the cached store,

          setting isFromCachedStore to false will avoid frontend UI flicker
        */
        state.isFromCachedStore = false
        return await handleEvent(state, action, vaultAddress, vaultContract)
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
        { contract: standardBountiesContract },
      ],
      init: initState(vaultContract),
    }
  )
}

const initState = (vaultContract) => async (cachedState) => {
  let nextState = await initializeTokens(cachedState || INITIAL_STATE, vaultContract)
  const github = await app.getCache('github').toPromise()
  if (github && github.token) {
    nextState.github = github
    initializeGraphQLClient(github.token)
  }
  /*
    This isFromCachedStore notifier is used to stop frontend flickering.
    We set the isFromCachedStore => true upon store initialization,
    when the frontend reducer receives the isFromCachedStore param,
    it knows its receiving the cached store state, instead of the
    cached application state.

    isFromCachedStore is never cached on application frontend
  */
  return { ...nextState, isFromCachedStore: true }
}
