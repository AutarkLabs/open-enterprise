import { ETH_DECIMALS } from './constants'
export const isNumberString = value => /^\d+(\.\d+)?$/.test(value)
export const isStringEmpty = string => string.length === 0
export const displayCurrency = amount => {
  return amount.div(ETH_DECIMALS).dp(3).toString()
}