import {
  FETCHING_PUBLIC_PROFILE,
  FETCHED_PUBLIC_PROFILE_SUCCESS,
  FETCHED_PUBLIC_PROFILE_ERROR,
  REQUESTED_PROFILE_UNLOCK,
  PROFILE_UNLOCK_SUCCESS,
  PROFILE_UNLOCK_FAILURE,
  REQUEST_EDIT_PROFILE,
  EDIT_FIELD,
  UPLOADING_IMAGE,
  UPLOADED_IMAGE_SUCCESS,
  UPLOADED_IMAGE_FAILURE,
  REQUESTED_PROFILE_SAVE,
  REQUESTED_PROFILE_SAVE_SUCCESS,
  REQUESTED_PROFILE_SAVE_ERROR,
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
  payload: {},
  error,
})

export const requestedProfileUnlock = ethereumAddress => ({
  type: REQUESTED_PROFILE_UNLOCK,
  meta: {
    ethereumAddress,
  },
})

export const profileUnlockSuccess = (ethereumAddress, unlockedProfile) => ({
  type: PROFILE_UNLOCK_SUCCESS,
  meta: {
    ethereumAddress,
  },
  payload: {
    unlockedProfile,
  },
})

export const profileUnlockFailure = (ethereumAddress, error) => ({
  type: PROFILE_UNLOCK_FAILURE,
  meta: {
    ethereumAddress,
  },
  error,
})

export const requestProfileEdit = ethereumAddress => ({
  type: REQUEST_EDIT_PROFILE,
  meta: {
    ethereumAddress,
  },
})

export const editField = (ethereumAddress, field, value) => ({
  type: EDIT_FIELD,
  meta: {
    ethereumAddress,
    field,
  },
  payload: {
    value,
  },
})

export const uploadingImage = ethereumAddress => ({
  type: UPLOADING_IMAGE,
  meta: {
    ethereumAddress,
  },
})

export const uploadedImage = (ethereumAddress, imageContentHash) => ({
  type: UPLOADED_IMAGE_SUCCESS,
  meta: {
    ethereumAddress,
  },
  payload: {
    cid: imageContentHash,
  },
})

export const uploadedImageFailure = (ethereumAddress, error) => ({
  type: UPLOADED_IMAGE_FAILURE,
  meta: {
    ethereumAddress,
  },
  error,
})

export const savingProfile = (ethereumAddress, profile) => ({
  type: REQUESTED_PROFILE_SAVE,
  meta: {
    ethereumAddress,
  },
})

export const savedProfile = (ethereumAddress, profile) => ({
  type: REQUESTED_PROFILE_SAVE_SUCCESS,
  meta: {
    ethereumAddress,
  },
  payload: {
    profile,
  },
})

export const saveProfileError = (ethereumAddress, error) => ({
  type: REQUESTED_PROFILE_SAVE_ERROR,
  meta: {
    ethereumAddress,
  },
  error,
})
