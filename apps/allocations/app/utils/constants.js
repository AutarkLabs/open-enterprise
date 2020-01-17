import { BigNumber } from 'bignumber.js'

export const ETH_DECIMALS = new BigNumber(10e17)
export const MIN_AMOUNT = new BigNumber(1e-18)
export const STATUS_UNDERGOING_VOTE = 'STATUS_UNDERGOING_VOTE'
export const STATUS_REJECTED = 'STATUS_REJECTED'
export const STATUS_APPROVED = 'STATUS_APPROVED'
export const STATUS_ENACTED = 'STATUS_ENACTED'
export const STATUSES = {
  STATUS_UNDERGOING_VOTE: 'Undergoing vote',
  STATUS_REJECTED: 'Rejected',
  STATUS_APPROVED: 'Approved',
  STATUS_ENACTED: 'Enacted',
}
