import { updateAccounts } from './account'
import { updateAllocations } from './allocation'
import { addressesEqual } from '../../../../shared/lib/web3-utils'
import { events, vaultLoadBalance } from '../../../../shared/store-utils'
import { ipfsGet } from '../../../../shared/ui/utils/ipfs-helpers'
import { app } from '../../../../shared/store-utils'

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
    return {
      ...state,
      offchainActions: await onForwardedActions(returnValues)
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

const onForwardedActions = async ({ failedActionKeys = [], pendingActionKeys = [], actions }) => {
  const offchainActions = { pendingActions: [], failedActions: [] }

  const getDataFromKey = async key => {
    const action = actions[key]
    const data = await app.queryAppMetadata(action.currentApp, action.actionId).toPromise()
    if (!data) return
    let metadata = await ipfsGet(data.cid)
    if (!metadata) return
    return { ...action, ...metadata }
  }

  let getFailedActionData = failedActionKeys.map(getDataFromKey)

  let getPendingActionData = pendingActionKeys.map(getDataFromKey)

  offchainActions.failedActions = (await Promise.all(getFailedActionData))
    .filter(action => action !== undefined)
    .map(action => ({ ...action, 
      date: new Date(action.startDate), 
      description: action.metadata,
      amount: String(action.balance),
      distSet: false,
      pending: false,
      recipients: action.options.map(optionsToRecipients),
      status: 1
    }))

  offchainActions.pendingActions = (await Promise.all(getPendingActionData))
    .filter(action => action !== undefined)
    .map(action => ({ ...action, 
      date: new Date(action.startDate), 
      description: action.metadata, 
      amount: String(action.balance),
      distSet: false,
      pending: true,
      recipients: action.options.map(optionsToRecipients),
      status: 0
    }))

  return offchainActions
}

const optionsToRecipients = ({ label: candidateAddress, value: supports }) =>
  ({ candidateAddress, supports, executions: 0 })
