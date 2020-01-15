/* global artifacts, web3 */
const newDAO = require('./new-dao')


const VOTE_DURATION = 60 // seconds
// TODO: this is min quorum in dot-voting? it does not accept zero, but 1e-16
const SUPPORT_REQUIRED = 1 // 0 = 0%; 50e16 = 50%
// this accepts zero in dot voting
const MIN_ACCEPTANCE_QUORUM = 0 // 20e16 = 20%

// define template params
const settings = {
  allocationsPeriod: 0,
  // The order is important
  dotVotingSettings: [ SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION ],
  financePeriod: 0,
  id: '',
  members: [
    '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb',
  ],
  stakes: [
    '100000000000000000000',
    '1000000000000000000',
  ],
  token: { name: 'Autark DEV Coin', symbol: 'AUTD' },
  useDiscussions: true,
  // The order is important for now. TODO: make it an object instead
  votingSettings: [ SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION ],
}

// create new dao
module.exports = callback => newDAO({ artifacts, callback, settings, web3 })
