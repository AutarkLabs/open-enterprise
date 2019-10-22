import { ETH_DECIMALS } from './constants'
import BigNumber from 'bignumber.js'
export const displayCurrency = amount => {
  return BigNumber(amount).div(ETH_DECIMALS).dp(3).toString()
}
export const toWei = amount => {
  return BigNumber(amount).times(ETH_DECIMALS).toNumber()
}
