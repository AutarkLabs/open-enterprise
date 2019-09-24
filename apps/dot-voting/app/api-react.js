import buildStubbedApiReact from '../../../shared/api-react'
import { ETHER_TOKEN_FAKE_ADDRESS } from './utils/token-utils'

const initialState = process.env.NODE_ENV !== 'production' && {
  token: ETHER_TOKEN_FAKE_ADDRESS,
  voteTime: 60000,
  PCT_BASE: 1e18,
  globalCandidateSupportPct: 0,
  globalMinQuorum: 50e16,
  entries: [],
  votes: [],
}

const functions = process.env.NODE_ENV !== 'production' && ((appState, setAppState) => ({
  createVote: ({
    description = 'Define the budget allocation for 2020 ops',
    type = 'allocation'
  } = {}) => setAppState({
    ...appState,
    votes: [
      ...appState.votes,
      {
        voteId: appState.votes.length + 1,
        quorumProgress: 0,
        data: {
          balance: 10e18,
          creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
          metadata: description,
          minAcceptQuorum: 0,
          options: [{
            label: '0xcaaacaaacaaacaaacaaacaaacaaacaaacaaacaaa',
            value: '0',
          }, {
            label: '0xdaaadaaadaaadaaadaaadaaadaaadaaadaaadaaa',
            value: '0',
          }],
          participationPct: 0,
          snapshotBlock: -1,
          startDate: new Date().getTime(),
          tokenSymbol: 'ETH',
          totalVoters: 300e18,
          type,
        }
      }
    ]
  }),
}))

const { AragonApi, useAragonApi, useNetwork } = buildStubbedApiReact({ initialState, functions })

export { AragonApi, useAragonApi, useNetwork }
