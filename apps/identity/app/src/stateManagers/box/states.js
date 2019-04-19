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
    job: '',
    location: '',
    school: '',
    website: '',
    description: '',
  },
  changed: [],
})

export const fetchedPublicProfileSuccess = (state, publicProfile) => {
  return {
    ...state,
    loadingPublicProf: false,
    loadedPublicProf: true,
    loadedPublicProfSuccess: true,
    publicProfile,
    forms: {
      name: publicProfile.name || '',
      job: publicProfile.job || '',
      location: publicProfile.location || '',
      school: publicProfile.school || '',
      website: publicProfile.website || '',
      description: publicProfile.description || '',
    },
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

export const editedField = (state, field, value) => ({
  ...state,
  forms: {
    ...state.forms,
    [field]: value,
  },
  changed: calculateChanged(state.changed, field),
})
