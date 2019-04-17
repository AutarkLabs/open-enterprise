import {
  FETCHING_PUBLIC_PROFILE,
  FETCHED_PUBLIC_PROFILE_SUCCESS,
  FETCHED_PUBLIC_PROFILE_ERROR,
} from './actionTypes'

export const fetchingProfile = ethereumAddress => ({
  type: FETCHING_PUBLIC_PROFILE,
  meta: {
    ethereumAddress,
  },
})

export const fetchedPublicProfile = (ethereumAddress, publicProfile) => ({
  type: FETCHED_PUBLIC_PROFILE_SUCCESS,
  meta: {
    ethereumAddress,
  },
  payload: {
    publicProfile,
  },
})

export const fetchedPublicProfileError = (ethereumAddress, error) => ({
  type: FETCHED_PUBLIC_PROFILE_ERROR,
  meta: {
    ethereumAddress,
  },
  payload: {
    error,
  },
})
