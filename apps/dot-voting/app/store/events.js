import { castVote, executeVote, startVote } from './votes'
import { hasLoadedVoteSettings, loadVoteSettings } from '../utils/vote-settings'
import { handleAction } from './'

export const handleEvent = async (state, event, settings) => {
  const {
    event: eventName,
    // TODO: implement eventAddress:
    // address: eventAddress,
    returnValues
  } = event
  let nextState = {
    ...state,
    ...(!hasLoadedVoteSettings(state) ? await loadVoteSettings() : {}),
  }
  switch (eventName) {
  case 'SYNC_STATUS_SYNCING': {
    nextState = {
      ...nextState,
      isSyncing: true,
    }
    break
  }
  case 'SYNC_STATUS_SYNCED': {
    nextState = {
      ...nextState,
      isSyncing: false,
    }
    break
  }
  case 'CastVote':
    nextState = await castVote(nextState, returnValues, settings)
    break
  case 'ExecutionScript':
    break
  case 'ExecuteVote':
    nextState = await executeVote(nextState, returnValues)
    handleAction(nextState, event)
    break
  case 'StartVote':
    nextState = await startVote(nextState, returnValues)
    handleAction(nextState, event)
    break
  case 'EntryAdded':
    nextEntries = await onEntryAdded({ entries, addressBook }, returnValues)
    nextState.entries = nextEntries
    break
  case 'EntryRemoved':
    nextEntries = await onEntryRemoved({ entries, addressBook }, returnValues)
    nextState.entries = nextEntries
    break
  case 'UpdateQuorum':
  case 'UpdateMinimumSupport':
  default:
    break
  }
  return nextState
}
