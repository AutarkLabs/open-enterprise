import { initializeTokens, vaultLoadBalance } from './token'
import { filterEntries } from '../../../address-book/app/script'
import { onFundedAccount, onNewAccount, onPayoutExecuted } from './account'
import { onEntryAdded, onEntryRemoved } from './entry'
import { INITIALIZATION_TRIGGER } from './'
import { addressesEqual } from '../utils/web3-utils'

export const handleEvent = async (state, event, settings) => {
  const { event: eventName, address: eventAddress, returnValues: returnValues } = event
  const { vault } = settings
  const { addressBook, entries, accounts } = state
  let nextAccounts, nextEntries
  let nextState = { ...state, }

  if (eventName === INITIALIZATION_TRIGGER) {
    nextState = await initializeTokens(nextState, settings)
  }
  else if (addressesEqual(eventAddress, vault.address)) {
    // Vault event
    nextState = await vaultLoadBalance(nextState, event, settings)
    console.log('vault change', nextState)
  }
  else {
    switch (eventName) {
    case 'FundAccount':
      nextAccounts = await onFundedAccount(accounts, returnValues)
      break
    case 'NewAccount':
      nextAccounts = await onNewAccount(accounts, returnValues)
      break
    case 'PayoutExecuted':
      nextAccounts = await onPayoutExecuted(accounts, returnValues)
      break
    case 'EntryAdded':
      nextEntries = await onEntryAdded({ entries, addressBook }, returnValues)
      break
    case 'EntryRemoved':
      nextEntries = await onEntryRemoved({ entries, addressBook }, returnValues)
      break
    default:
      break
    }
    // If nextAccounts or nextEntries were not generated
    // then return each original array
    nextState.accounts =  nextAccounts || accounts
    nextState.entries = (nextEntries && filterEntries(nextEntries)) || entries
  }

  return nextState
}
