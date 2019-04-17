import { initializeTokens, vaultLoadBalance } from './token'
import { filterEntries } from '../../../address-book/app/script'
import { onFundedAccount, onNewAccount, onPayoutExecuted } from './account'
import { onEntryAdded, onEntryRemoved } from './entry'
import { INITIALIZATION_TRIGGER } from './'
import { addressesEqual } from '../utils/web3-utils'

export const handleEvent = async (state, event, settings) => {
  // Debug here please:
  debugger // un-comment this to debug on chrome sources tab
  // console.log('handling event:', { state, event, settings })

  const { address: eventAddress, event: eventName, returnValues } = event
  const { addressBook, vault } = settings
  const { accounts, entries, payouts } = state

  let nextAccounts, nextEntries, nextBoth
  let nextState = { ...state }
  if (eventName === INITIALIZATION_TRIGGER) {
    nextState = await initializeTokens(nextState, settings)
  } else if (addressesEqual(eventAddress, vault.address)) {
    // Vault event
    nextState = await vaultLoadBalance(nextState, event, settings)
    // TODO: handle events by eventAddress, to difference addressBook, allocations, vault events
  } else {
    switch (eventName) {
    case 'FundAccount':
      nextAccounts = await onFundedAccount(accounts, returnValues)

      nextState.accounts = nextAccounts
      break
    case 'NewAccount':
      nextAccounts = await onNewAccount(accounts, returnValues)

      nextState.accounts = nextAccounts
      break
    case 'PayoutExecuted':
      nextBoth = await onPayoutExecuted(payouts, accounts, returnValues)

      nextState.accounts = nextBoth.accounts
      nextState.payouts = nextBoth.payouts
      break
    case 'SetDistribution':
      nextBoth = await onPayoutExecuted(payouts, accounts, returnValues)

      nextState.accounts = nextBoth.accounts
      nextState.payouts = nextBoth.payouts
      break
    case 'EntryAdded':
      nextEntries = await onEntryAdded({ entries, addressBook }, returnValues)
      nextState.entries = filterEntries(nextEntries)
      break
    case 'EntryRemoved':
      nextEntries = await onEntryRemoved(
        { entries, addressBook },
        returnValues
      )
      nextState.entries = filterEntries(nextEntries)
      break
    default:
      break
    }
  }
  // If nextAccounts or nextEntries were not generated
  // then return each original array
  return nextState
}
