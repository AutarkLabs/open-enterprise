import { app } from '../app'

const loadSettings = () => {
  return new Promise(resolve => {
    app.call('getSettings').subscribe(settings => {
      resolve(settings)
    })
  })
}

export const syncSettings = async state => {
  try {
    const settings = await loadSettings()
    state.bountySettings = settings
    return state
  } catch (err) {
    console.error('[Projects script] syncSettings settings failed:', err)
  }
}
