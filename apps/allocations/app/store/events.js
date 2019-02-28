import { filterEntries } from '../../../address-book/app/script'
import { onFundedAccount, onNewAccount, syncAccounts } from './account'
import { onEntryAdded, onEntryRemoved } from './entry'

export const handleEvent = async (state, { event, returnValues }) => {
  const { addressBook, entries, accounts } = state
  let nextAccounts, nextEntries

  switch (event) {
  case 'FundAccount':
    nextAccounts = await onFundedAccount(accounts, returnValues)
    break
  case 'NewAccount':
    nextAccounts = await onNewAccount(accounts, returnValues)
    break
  case 'PayoutExecuted':
  case 'SetDistribution':
    nextAccounts = await syncAccounts(accounts, returnValues)
    break
  case 'EntryAdded':
    nextEntries = await onEntryAdded({ entries, addressBook }, returnValues)
    break
  case 'EntryRemoved':
    nextEntries = await onEntryRemoved({ entries, addressBook }, returnValues)
    break
  default:
    console.log('[Allocations script] Unknown event', event, returnValues) // Too spammy TODO: remove?
    break
  }
  // If nextAccounts or nextEntries were not generated
  // then return each original array
  const filteredState = {
    accounts: nextAccounts || accounts,
    entries: (nextEntries && filterEntries(nextEntries)) || entries,
  }
  return filteredState
}
