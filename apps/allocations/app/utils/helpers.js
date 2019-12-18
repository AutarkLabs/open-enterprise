import { ETH_DECIMALS } from './constants'
export const isStringEmpty = string => string.length === 0
export const displayCurrency = amount => {
  return amount.div(ETH_DECIMALS).dp(3).toNumber().toLocaleString()
}
export const sortByDateKey = key => {
  return (a,b) => {
    return a[key].getTime() >= b[key].getTime() ? -1 : 1
  }
}
export function formatDate({ date, short }) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: short ? undefined : 'long',
  }).format(date)
}
