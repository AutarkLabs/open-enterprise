import { round } from './math-utils'

export function formatDecimals(value, digits) {
  try {
    return value.toLocaleString('latn', {
      style: 'decimal',
      maximumFractionDigits: digits,
    })
  } catch (err) {
    if (err.name === 'RangeError') {
      // Fallback to Number.prototype.toString()
      // if the language tag is not supported.
      return value.toString()
    }
    throw err
  }
}

export function formatTokenAmount(
  amount,
  isIncoming,
  decimals = 0,
  displaySign = false,
  { rounding = 2 } = {}
) {
  return (
    (displaySign ? (isIncoming ? '+' : '-') : '') +
    formatDecimals(round(amount / Math.pow(10, decimals), rounding), 18)
  )
}

/**
 * Chooses between two objects depending on whether a given array property in
 * each of them has content. If the comparison is nonconclusive, the first
 * object (the incumbent) is returned.
 */
export const getContentHolder = (property, incumbent, contender) => {
  if (incumbent && incumbent.hasOwnProperty(property)
      && incumbent[property].length > 0)
    return incumbent
  if (contender && contender.hasOwnProperty(property)
      && contender[property].length > 0)
    return contender
  return incumbent
}
