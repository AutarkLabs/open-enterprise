import { getContentHolder } from '../../../shared/lib/utils'

let prevState = {}

function appStateReducer(currentState) {
  const state = getContentHolder('repos', currentState, prevState)
  prevState = { ...state }
  return state || {}
}

// note - some comments about enhancing this reducer can be found: https://github.com/AutarkLabs/open-enterprise/issues/1348

export default appStateReducer
