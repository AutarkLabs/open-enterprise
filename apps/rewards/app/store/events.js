import { filterEntries } from '../../../address-book/app/script'
import { onFundedAccount, onNewAccount, onPayoutExecuted } from './account'
import { onEntryAdded, onEntryRemoved } from './entry'
import { initializeTokens, vaultLoadBalance } from './token'
import { onRewardAdded } from './reward'
import { addressesEqual } from '../utils/web3-utils'
import { INITIALIZATION_TRIGGER } from './'
export const handleEvent = async (state, event, settings) => {
  //const { addressBook, entries, accounts } = state
  const { event: eventName, returnValues, address: eventAddress, } = event
  const { vault } = settings
  let nextAccounts, nextEntries
  let nextState = { ...state, }
  console.log('old state: ', state)
  console.log('nextState: ', nextState)
  console.log('trigger: ', eventName === INITIALIZATION_TRIGGER)
  //console.log(eventName, INITIALIZATION_TRIGGER)
  if (eventName === INITIALIZATION_TRIGGER) {
    nextState = await initializeTokens(nextState, settings)
  }
  else if (addressesEqual(eventAddress, vault.address)) {
    // Vault event
    console.log('vault event: ', event)
    nextState = await vaultLoadBalance(nextState, event, settings)
  }
  else {
    switch (eventName) {
    case 'RewardAdded':
      nextState = await onRewardAdded(nextState, returnValues)
      console.log('rewardAdded caught', nextState)
      break
    //case 'FundAccount':
    //  nextAccounts = await onFundedAccount(accounts, returnValues)
    //  break
    //case 'NewAccount':
    //  nextAccounts = await onNewAccount(accounts, returnValues)
    //  break
    //case 'PayoutExecuted':
    //  nextAccounts = await onPayoutExecuted(accounts, returnValues)
    //  break
    //case 'EntryAdded':
    //  nextEntries = await onEntryAdded({ entries, addressBook }, returnValues)
    //  break
    //case 'EntryRemoved':
    //  nextEntries = await onEntryRemoved({ entries, addressBook }, returnValues)
    //  break
    default:
      console.log('[Rewards reducer] unhandled event:', event, returnValues)
      break
    }
  }
  // If nextAccounts or nextEntries were not generated
  // then return each original array
  //onst filteredState = {
  // accounts: nextAccounts || accounts,
  // entries: (nextEntries && filterEntries(nextEntries)) || entries,
  nextState = { ...state, ...nextState }
  return nextState
}
