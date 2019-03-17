import vaultAbi from '../../../shared/json-abis/vault'
import { app, handleEvent } from './'

export const initStore = vaultAddress => {
  const vaultApp = app.external(vaultAddress, vaultAbi)

  const initialState = {
    rewards: [],
    vault: vaultAddress,
  }

  return app.store(
    async (state, event) => {
      // ensure there are initial placeholder values
      if (!state) state = initialState

      try {
        const next = await handleEvent(state, event)
        const nextState = { ...initialState, ...next }
        // Debug point
        console.log('[Rewards store]', nextState)
        return nextState
      } catch (err) {
        console.error('[Rewards script] initStore', event, err)
      }
      // always return the state even unmodified
      return state
    },
    [
      // handle vault events
      vaultApp.events(),
    ]
  )
}
