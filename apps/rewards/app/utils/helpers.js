import { ETH_DECIMALS } from './constants'
import BN from 'bignumber.js'
export const isNumberString = value => /^\d+(\.\d+)?$/.test(value)
export const isStringEmpty = string => string.length === 0
export const displayCurrency = amount => {
  console.log(BN(amount).toString())
  //return BN(amount).div(ETH_DECIMALS).dp(3).toString()
  return BN(amount).dp(3).toString()
}

export const toCurrency = (amount, decimals) => {
  return BN(amount).times(BN(10).pow(decimals)).toString()
}
