import { populateFormValue } from '../../../modules/3box-LD'
import { worksFor, homeLocation, image } from '../../../modules/things'

export const initialState = {}

export const fetchingPublicProfile = () => ({
  loadingPublicProf: true,
  loadedPublicProf: false,
  loadedPublicProfSuccess: false,
  unlockingProf: false,
  unlockedProf: false,
  unlockedProfSuccess: false,
  editingProfile: false,
  unlockedBox: {},
  publicProfile: {},
  forms: {
    name: '',
    jobTitle: '',
    worksFor: worksFor({}),
    homeLocation: homeLocation(''),
    affiliation: [{}],
    url: '',
    description: '',
  },
  changed: [],
  uploadingImage: false,
  uploadedImageSuccess: false,
  uploadedImage: false,
})

export const fetchedPublicProfileSuccess = (state, publicProfile) => {
  return {
    ...state,
    loadingPublicProf: false,
    loadedPublicProf: true,
    loadedPublicProfSuccess: true,
    publicProfile,
    forms: populateFormValue(publicProfile),
    changed: [],
  }
}

export const fetchedPublicProfileErr = (state, error) => ({
  ...state,
  loadingPublicProf: false,
  loadedPublicProf: true,
  loadedPublicProfSuccess: true,
  error,
})

export const requestedProfUnlock = state => ({
  ...state,
  unlockingProf: true,
  unlockedProf: false,
  unlockedProfSuccess: false,
  unlockedBox: {},
})

export const profileUnlocked = (state, unlockedBox) => ({
  ...state,
  unlockingProf: false,
  unlockedProf: true,
  unlockedProfSuccess: true,
  editedProfile: false,
  unlockedBox,
})

export const profileUnlockFailed = (state, error) => ({
  ...state,
  unlockingProf: false,
  unlockedProf: true,
  unlockedProfSuccess: false,
  error,
})

export const requestProfileEdit = state => ({
  ...state,
  editingProfile: true,
})

const calculateChanged = (changed, field) => {
  if (!changed) return [field]

  if (!changed.includes(field)) return [...changed, field]
  return changed
}

export const editedField = (state, field, value) => {
  if (field === 'homeLocation') {
    return {
      ...state,
      forms: {
        ...state.forms,
        homeLocation: homeLocation(value),
      },
      changed: calculateChanged(state.changed, field),
    }
  }

  if (field === 'worksFor') {
    return {
      ...state,
      forms: {
        ...state.forms,
        worksFor: worksFor(value),
      },
      changed: calculateChanged(state.changed, field),
    }
  }

  return {
    ...state,
    forms: {
      ...state.forms,
      [field]: value,
    },
    changed: calculateChanged(state.changed, field),
  }
}

export const uploadingImage = state => ({
  ...state,
  uploadingImage: true,
  uploadedImageSuccess: false,
  uploadedImage: false,
})

export const uploadedImage = (state, imageHash) => ({
  ...state,
  uploadingImage: false,
  uploadedImageSuccess: true,
  uploadedImage: true,
  forms: {
    ...state.forms,
    image: image(imageHash),
  },
  changed: calculateChanged(state.changed, 'image'),
})

export const uploadedImageError = (state, error) => ({
  ...state,
  uploadingImage: false,
  uploadedImageSuccess: false,
  uploadedImage: true,
  image_error: error,
})
