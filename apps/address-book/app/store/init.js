import { app, handleEvent } from './'
import testReturnAbi from '../../../shared/json-abis/testReturn'

export const initStore = () => {
  const testReturnContract = app.external('0x0f407b6532bb4092638ad5ced2b17bd34d521402', testReturnAbi.abi)

  const initialState = {
    entries: [],
    testReturnContract
  }
  return app.store(
    async (state, event) => {
      // ensure there are initial placeholder values
      if (!state) state = initialState

      try {
        const next = await handleEvent(state, event)
        const nextState = { ...initialState, ...next }
        // Debug point
        return nextState
      } catch (err) {
        console.error('[Address Book script] initStore', event, err)
      }
      // always return the state even unmodified
      return state
    },
    [
      testReturnContract.events(),
    ]
  )
}
