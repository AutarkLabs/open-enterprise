import { safeDiv } from './math-utils'
import {
  VOTE_ABSENT,
  VOTE_STATUS_ONGOING,
  VOTE_STATUS_FAILED,
  VOTE_STATUS_SUCCESSFUL,
  VOTE_STATUS_EXECUTED
} from './vote-types'

export const EMPTY_CALLSCRIPT = '0x00000001'

export const getAccountVote = (account, voters) =>
  voters[account] || VOTE_ABSENT

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
