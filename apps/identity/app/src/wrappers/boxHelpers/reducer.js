import {
  FETCHING_PUBLIC_PROFILE,
  FETCHED_PUBLIC_PROFILE_SUCCESS,
  FETCHED_PUBLIC_PROFILE_ERROR,
} from './actionTypes'

import {
  fetchingPublicProfileState,
  fetchedPublicProfileSuccessState,
  fetchedPublicProfileErrorState,
} from './states'

import { log } from '../../../utils'

// TODO: Fix lint

const logStateUpdate = (action, prevState, nextState) => {
  log('ACTION: ', action, 'PREV STATE: ', prevState, 'NEXT STATE:', nextState)
}

const boxReducer = (prevState, action) => {
  switch (action.type) {
    case FETCHING_PUBLIC_PROFILE: {
      const nextState = { ...prevState }
      nextState.boxes[
        action.meta.ethereumAddress
      ] = fetchingPublicProfileState()
      logStateUpdate(action, prevState, nextState)
      return nextState
    }
    case FETCHED_PUBLIC_PROFILE_SUCCESS: {
      const nextState = { ...prevState }
      const ethereumAddress = action.meta.ethereumAddress
      nextState.boxes[ethereumAddress] = fetchedPublicProfileSuccessState(
        prevState.boxes[ethereumAddress],
        action.payload.publicProfile
      )
      logStateUpdate(action, prevState, nextState)
      return nextState
    }
    case FETCHED_PUBLIC_PROFILE_ERROR: {
      const nextState = { ...prevState }
      nextState.boxes[
        action.meta.ethereumAddress
      ] = fetchedPublicProfileErrorState(action.error)
      logStateUpdate(action, prevState, nextState)
      return nextState
    }
    default: {
      return prevState
    }
  }
}

export default boxReducer
