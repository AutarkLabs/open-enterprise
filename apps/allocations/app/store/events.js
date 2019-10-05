// import { vaultLoadBalance } from './token'
import { updateAccounts } from './account'
import { updateAllocations } from './allocation'
import { addressesEqual } from '../../../../shared/lib/web3-utils'
import { events, vaultLoadBalance } from '../../../../shared/store-utils'

const eventHandler = async eventData => {
  const {
    state,
    event: { address, event, returnValues },
    settings,
  } = eventData

  // Syncing events
  if (event === events.SYNC_STATUS_SYNCING) {
    return { ...state, isSyncing: true }
  } else if (event === events.SYNC_STATUS_SYNCED) {
    return { ...state, isSyncing: false }
  }
  console.log('event received', event, returnValues)
  // Vault events
  if (addressesEqual(address, settings.vault.address)) {
    // const vaultBalance = vaultLoadBalance(state, returnValues, settings)
    // console.log('upgrading vault balances', vaultBalance)

    return vaultLoadBalance(state, returnValues, settings)
  }
 
  // Allocations events
  switch (event) {
  case 'NewAccount':
    return {
      ...state,
      accounts: await updateAccounts(state.accounts, returnValues.accountId),
    }
  case 'SetDistribution':
    return {
      ...state,
      allocations: await updateAllocations(state.allocations, returnValues)
    }

    // case 'PayoutExecuted':
    //   nextBoth = await onPayoutExecuted(payouts, accounts, returnValues)
    //   nextState.accounts = nextBoth.accounts
    //   nextState.payouts = nextBoth.payouts
    //   break

  default:
    return { ...state }
  }
}

export default eventHandler
