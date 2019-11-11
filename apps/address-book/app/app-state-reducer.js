import { getContentHolder } from '../../../shared/lib/utils'

let prevState = {}

const appStateReducer = currentState => {
  const state = getContentHolder('entries', currentState, prevState)
  prevState = { ...state }
  return {
    ...state
  }
}
  
export default appStateReducer
