export const initialState = {
  boxes: {},
}

export const fetchingPublicProfileState = () => ({
  loadingPublicProf: true,
  loadedPublicProf: false,
  loadedPublicProfSuccess: false,
  unlockingProf: false,
  unlockedProf: false,
  unlockedProfSuccess: false,
  unlockedBox: {},
  publicProfile: {},
})

export const fetchedPublicProfileSuccessState = (state, publicProfile) => ({
  ...state,
  loadingPublicProf: false,
  loadedPublicProf: true,
  loadedPublicProfSuccess: true,
  publicProfile,
})

export const fetchedPublicProfileErrorState = (state, error) => ({
  ...state,
  loadingPublicProf: false,
  loadedPublicProf: true,
  loadedPublicProfSuccess: true,
  error,
})
