import { initializeTokens, vaultLoadBalance } from './token'
import { onRewardAdded, onRewardClaimed, onRefreshRewards } from './reward'
import { addressesEqual } from '../utils/web3-utils'
import { INITIALIZATION_TRIGGER } from './'

export const handleEvent = async (state, event, settings) => {
  const { event: eventName, returnValues, address: eventAddress, } = event
  const { vault } = settings

  let nextState = { ...state, }

  if (eventName === INITIALIZATION_TRIGGER) {
    nextState = await initializeTokens(nextState, settings)
  }
  else if (addressesEqual(eventAddress, vault.address)) {
    // Vault event
    nextState = await vaultLoadBalance(nextState, event, settings)
  }
  else {
    switch (eventName) {
    case 'RewardClaimed':
      nextState = await onRewardClaimed(nextState, returnValues)
      break
    case 'RewardAdded':
      nextState = await onRewardAdded(nextState, returnValues, settings)
      break
    case 'RefreshRewards':
      nextState = await onRefreshRewards(nextState, returnValues)
      break
    default:
      console.log('[Rewards reducer] unhandled event:', event, returnValues)
      break
    }
  }

  nextState = { ...state, ...nextState }
  return nextState
}
