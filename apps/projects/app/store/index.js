import { STATUS } from '../utils/github'

export { app } from './app'
export { handleEvent } from './events'
export { initStore } from './init'

export const INITIAL_STATE = {
  repos: [],
  tokens: [],
  issues: [],
  bountySettings: {},
  github: { status: STATUS.INITIAL, token: null, event: '' }
}
