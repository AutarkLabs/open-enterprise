import { BigNumber } from 'bignumber.js'

export const ETH_DECIMALS = new BigNumber(10e17)
export const MIN_AMOUNT = new BigNumber(1e-18)
export const ONE_TIME = 'One-time'
export const RECURRING = 'Recurring'
export const MERIT = 'Merit'
export const DIVIDEND = 'Dividend'
export const ONE_TIME_DIVIDEND = 'One-time Dividend'
export const RECURRING_DIVIDEND = 'Recurring Dividend'
export const ONE_TIME_MERIT = 'One-time Merit'
export const REWARD_TYPES = [
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT
]
const DAYS = 'Days'
const WEEKS = 'Weeks'
export const MONTHS = 'Months'
const YEARS = 'Years'
export const DISBURSEMENT_UNITS = [
  DAYS,
  WEEKS,
  MONTHS,
  YEARS,
]
export const OTHER = 'Other…'
