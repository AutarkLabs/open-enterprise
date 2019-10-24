import { ETH_DECIMALS, ETH_DECIMALS_NUMBER } from './constants'
import BigNumber from 'bignumber.js'
export const displayCurrency = (amount, decimalsNumber=ETH_DECIMALS_NUMBER) => {
  const decimals = BigNumber(10).pow(decimalsNumber - 1)
  return BigNumber(amount).div(decimals).dp(3).toString()
}
export const toWei = amount => {
  return BigNumber(amount).times(ETH_DECIMALS).toNumber()
}
