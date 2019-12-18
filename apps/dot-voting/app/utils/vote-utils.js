import abi from 'ethereumjs-abi'
import utils from 'web3-utils'

import {
  VOTE_STATUS_EXECUTED,
  VOTE_STATUS_FAILED,
  VOTE_STATUS_SUCCESSFUL
} from './vote-types'

export const EMPTY_CALLSCRIPT = '0x00000001'

export const FUNC_TYPES = {
  '00000000' : 'information',
  'b3670f9e' : 'curation',
}

// Encodes an array of actions ({ to: address, calldata: bytes}) into the EVM call script format
// Sets spec id 1 = 0x00000001 and
// Concatenates per call [ 20 bytes (address) ] + [ 4 bytes (uint32: calldata length) ] + [ calldataLength bytes (payload) ]
export const encodeCallScript = actions => {
  return actions.reduce((script, { to, calldata }) => {
    const addr = abi.rawEncode(['address'], [to]).toString('hex')
    const length = abi.rawEncode(['uint256'], [(calldata.length - 2) / 2]).toString('hex')

    // Remove 12 first 0s of padding for addr and 28 0s for uint32
    return script + addr.slice(24) + length.slice(56) + calldata.slice(2)
  }, '0x00000001') // spec 1
}

export const encodeInformationVote = (contractAddress, description, options) => {
  const optionsString = options.join('')
  const optionsIndices = options.map(option => option.length)
  const nullIntArray = new Array(options.length).fill(0)
  const nullAddressArray = getFalseAddresses(options.length)
  const action = {
    to: contractAddress,
    calldata: '0x00000000' + abi.rawEncode(
      [ 'address[]', 'uint256[]', 'uint256[]', 'string', 'string', 'uint256[]', 'uint256[]' ],
      [ nullAddressArray, nullIntArray, optionsIndices, optionsString, description, nullIntArray, nullIntArray ]
    ).toString('hex')
  }
  return encodeCallScript([action])
}


export const getVoteStatus = (vote, globalMinQuorum) => {
  if (vote.data.executed) return VOTE_STATUS_EXECUTED

  const hasMinParticipation =
    vote.data.participationPct >= (globalMinQuorum / 10 ** 16)

  return hasMinParticipation
    ? VOTE_STATUS_SUCCESSFUL
    : VOTE_STATUS_FAILED
}

export const getTotalSupport = ({ options }) => {
  let totalSupport = 0
  options.forEach(option => {
    totalSupport = totalSupport + parseFloat(option.value, 10)
  })
  return totalSupport
}

const getFalseAddresses = num => {
  let arr = []
  for(let i = 0; i < num; i++){
    arr.push(utils.padLeft(utils.numberToHex(i), 40))
  }
  return arr
}
