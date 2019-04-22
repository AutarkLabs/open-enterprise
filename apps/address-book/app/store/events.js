import { onEntryAdded, onEntryRemoved } from './entry'

export const handleEvent = async (state, event) => {
  const { event: eventName, returnValues: returnValues } = event
  const { entries } = state
  let nextState = { ...state, }
  switch (eventName) {
  case 'EntryAdded':
    nextState.entries = await onEntryAdded({ entries }, returnValues)
    break
  case 'EntryRemoved':
    nextState.entries = await onEntryRemoved({ entries }, returnValues)
    break
  default:
    break
  }
  return nextState
}
