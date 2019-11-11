import { getContentHolder } from '../../../shared/lib/utils'

let prevState = {}

function appStateReducer(currentState) {
  const state = getContentHolder('votes', currentState, prevState)
  prevState = { ...state }
  return {
    ...state,
  }
}

export default appStateReducer
