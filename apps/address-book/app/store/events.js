import { onEntryAdded, onEntryRemoved } from './entry'

export const handleEvent = async (state, event) => {
  const { event: eventName, returnValues: returnValues, address: eventAddress } = event
  const { entries, testReturnContract: testReturn } = state
  let nextState = { ...state, }
  switch (eventName) {
  case 'EntryAdded':
    nextState.entries = await onEntryAdded({ entries }, returnValues)
    break
  case 'EntryRemoved':
    nextState.entries = await onEntryRemoved({ entries }, returnValues)
    break
  case 'NewInfo':
    console.log('new event', event)
    console.log('testReturns emitting!')
    console.log('counter: ', await testReturn.counter().toPromise())
    console.log('info: ', await testReturn.getInfo('1').toPromise())
    console.log('web3: ', web3)
    break
  default:
    break
  }
  return nextState
}
