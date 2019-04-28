import { app } from '../app'
import { toUtf8 } from '../../utils/web3-utils'

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
    const { expLevels, expMultipliers } = settings

    const expLvls = expLevels.map(
      // Float-ify exp levels
      (expLevel, i) => ({ mul: expMultipliers[i] / 100.0, name: toUtf8(expLevel) })
    )

    state.bountySettings = { ...settings, expLvls }
    return state
  } catch (err) {
    console.error('[Projects script] syncSettings settings failed:', err)
  }
}
