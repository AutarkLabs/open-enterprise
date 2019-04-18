import {
  FETCHING_PUBLIC_PROFILE,
  FETCHED_PUBLIC_PROFILE_SUCCESS,
  FETCHED_PUBLIC_PROFILE_ERROR,
  REQUESTED_PROFILE_UNLOCK,
  PROFILE_UNLOCK_SUCCESS,
  PROFILE_UNLOCK_FAILURE,
  REQUEST_EDIT_PROFILE,
} from './actionTypes'

import {
  fetchingPublicProfile,
  fetchedPublicProfileSuccess,
  fetchedPublicProfileErr,
  requestedProfUnlock,
  profileUnlocked,
  profileUnlockFailed,
  requestProfileEdit,
} from './states'

import { log } from '../../../utils'

const logStateUpdate = (action, prevState, nextState) => {
  log('ACTION: ', action, 'PREV STATE: ', prevState, 'NEXT STATE:', nextState)
}

const boxReducer = (prevState, action) => {
  switch (action.type) {
    case FETCHING_PUBLIC_PROFILE: {
      const nextState = { ...prevState }
      nextState[action.meta.ethereumAddress] = fetchingPublicProfile()
      logStateUpdate(action, prevState, nextState)
      return nextState
    }
    case FETCHED_PUBLIC_PROFILE_SUCCESS: {
      const nextState = { ...prevState }
      const ethereumAddress = action.meta.ethereumAddress
      nextState[ethereumAddress] = fetchedPublicProfileSuccess(
        prevState[ethereumAddress],
        action.payload.publicProfile
      )
      logStateUpdate(action, prevState, nextState)
      return nextState
    }
    case FETCHED_PUBLIC_PROFILE_ERROR: {
      const nextState = { ...prevState }
      const ethereumAddress = action.meta.ethereumAddress
      nextState[ethereumAddress] = fetchedPublicProfileErr(
        prevState[ethereumAddress],
        action.error
      )
      logStateUpdate(action, prevState, nextState)
      return nextState
    }
    case REQUESTED_PROFILE_UNLOCK: {
      const nextState = { ...prevState }
      const ethereumAddress = action.meta.ethereumAddress
      nextState[ethereumAddress] = requestedProfUnlock(
        prevState[ethereumAddress]
      )
      logStateUpdate(action, prevState, nextState)
      return nextState
    }
    case PROFILE_UNLOCK_SUCCESS: {
      const nextState = { ...prevState }
      const ethereumAddress = action.meta.ethereumAddress
      nextState[ethereumAddress] = profileUnlocked(
        prevState[ethereumAddress],
        action.payload.unlockedProfile
      )
      logStateUpdate(action, prevState, nextState)
      return nextState
    }
    case PROFILE_UNLOCK_FAILURE: {
      const nextState = { ...prevState }
      const ethereumAddress = action.meta.ethereumAddress
      nextState[ethereumAddress] = profileUnlockFailed(
        prevState[ethereumAddress],
        action.error
      )
      logStateUpdate(action, prevState, nextState)
      return nextState
    }
    case REQUEST_EDIT_PROFILE: {
      const nextState = { ...prevState }
      const ethereumAddress = action.meta.ethereumAddress
      nextState[ethereumAddress] = requestProfileEdit(
        prevState[ethereumAddress]
      )
      logStateUpdate(action, prevState, nextState)
      return nextState
    }
    default: {
      return prevState
    }
  }
}

export default boxReducer
