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
        { contract: standardBountiesContract },
      ],
      init: initState(vaultContract),
    }
  )
}

const initState = (vaultContract) => async (cachedState = INITIAL_STATE) => {
  let nextState = await initializeTokens(cachedState, vaultContract)
  const github = await app.getCache('github').toPromise()
  if (github && github.token) {
    nextState.github = github
    initializeGraphQLClient(github.token)
  }

  return nextState
}
