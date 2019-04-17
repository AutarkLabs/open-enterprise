import { app, handleEvent } from './'


export const initStore = () => {

  const initialState = {
    entries: [],
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
    }
  )
}
