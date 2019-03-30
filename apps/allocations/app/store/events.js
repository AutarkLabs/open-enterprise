import { filterEntries } from '../../../address-book/app/script'
import { onFundedAccount, onNewAccount, onPayoutExecuted } from './account'
import { onEntryAdded, onEntryRemoved } from './entry'

export const handleEvent = async (state, { event, returnValues }) => {
  const { addressBook, entries, accounts, payouts } = state
  let nextAccounts, nextEntries, nextPayouts, nextBoth

  switch (event) {
  case 'FundAccount':
    nextAccounts = await onFundedAccount(accounts, returnValues)
    break
  case 'NewAccount':
    nextAccounts = await onNewAccount(accounts, returnValues)
    break
  case 'PayoutExecuted':
    nextBoth = await onPayoutExecuted(payouts, accounts, returnValues)
    nextAcounts = nextBoth.accounts
    nextPayouts = nextBoth.payouts
    break
  case 'SetDistribution':
    nextBoth = await onPayoutExecuted(payouts, accounts, returnValues)
    nextAccounts = nextBoth.accounts
    nextPayouts = nextBoth.payouts
    console.log('payout state', filteredState)
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
  const filteredState = {
    accounts: nextAccounts || accounts,
    payouts: nextPayouts || payouts,
    entries: (nextEntries && filterEntries(nextEntries)) || entries,
  }
  return filteredState
}
