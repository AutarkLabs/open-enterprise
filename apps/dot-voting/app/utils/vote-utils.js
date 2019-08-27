import {
  VOTE_STATUS_EXECUTED,
  VOTE_STATUS_FAILED,
  VOTE_STATUS_SUCCESSFUL
} from './vote-types'

export const EMPTY_CALLSCRIPT = '0x00000001'

export const getVoteStatus = (vote) => {
  if (vote.data.executed) {
    return VOTE_STATUS_EXECUTED
  }
  const hasMinParticipation = vote.quorumProgress >= vote.minParticipationPct
  return hasMinParticipation
    ? VOTE_STATUS_SUCCESSFUL
    : VOTE_STATUS_FAILED
}

export const getQuorumProgress = ({ participationPct }) =>
  participationPct

export const getTotalSupport = ({ options }) => {
  let totalSupport = 0
  options.forEach(option => {
    totalSupport = totalSupport + parseFloat(option.value, 10)
  })
  return totalSupport
}

export function shortenAddress(address, charsLength = 4) {
  const prefixLength = 2 // "0x"
  if (!address) {
    return ''
  }
  if (address.length < charsLength * 2 + prefixLength) {
    return address
  }
  return (
    address.slice(0, charsLength + prefixLength) +
    '…' +
    address.slice(-charsLength)
  )
}

export { isAddress } from 'web3-utils'
