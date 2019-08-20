// import { vaultLoadBalance } from './token'
import { updateAccounts } from './account'
import { updateAllocations } from './allocation'
import { addressesEqual } from '../../../../shared/lib/web3-utils'
import { events, vaultLoadBalance } from '../../../../shared/store-utils'
import { app } from './app'

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
  // Vault events
  if (addressesEqual(address, settings.vault.address)) {
    // const vaultBalance = vaultLoadBalance(state, returnValues, settings)

    return vaultLoadBalance(state, returnValues, settings)
  }

  // Allocations events
  switch (event) {
  case 'NewAccount':
  case 'SetBudget':
    return {
      ...state,
      accounts: await updateAccounts(state.accounts, returnValues.accountId),
    }
  case 'SetDistribution':
    return {
      ...state,
      allocations: await updateAllocations(state.allocations, returnValues)
    }
    
  case 'ForwardedActions':
    console.log('forwardedAction Caught: ', returnValues)
    onForwardedActions(returnValues)
    return {
      ...state
    }

  case 'PayoutExecuted':
    return {
      ...state,
      accounts: await updateAccounts(state.accounts, returnValues.accountId),
      allocations: await updateAllocations(state.allocations, returnValues)
    }

  default:
    return { ...state }
  }
}

export default eventHandler

const onForwardedActions = async ({ failedActionKeys, actions }) => {
  const action = actions[failedActionKeys[0]]
  console.log(action)
  console.log('Get the metadata: ',(await app.queryAppMetadata(action.currentApp, action.actionId).toPromise()))
  app.emitTrigger('test trigger')
}
