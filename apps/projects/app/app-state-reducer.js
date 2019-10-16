import { INITIAL_STATE } from './store'

let cachedStateInitialized = false

function appStateReducer(state) {
  if ((state && state.isFromCachedStore) || cachedStateInitialized) {
    cachedStateInitialized = true
    /*
      This app state reducer receives state from two different places,
      which causes a frontend UI flicker

      on page load, it receives a cached application state, which then
      gets overwritten by the cached store state, which is ~100 blocks behind

      We need to make sure not to cache the notifier param in application state,
      so it knows when its receiving the store cached state, and stick with it
    */
    return { ...state }
  }

  /*
    otherwise, ignore application state
  */
  return INITIAL_STATE
}

// note - some comments about enhancing this reducer can be found: https://github.com/AutarkLabs/open-enterprise/issues/1348

export default appStateReducer
