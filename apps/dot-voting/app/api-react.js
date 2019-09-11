import buildStubbedApiReact from '../../../shared/api-react'
import { ETHER_TOKEN_FAKE_ADDRESS } from './utils/token-utils'

const initialState = process.env.NODE_ENV !== 'production' && {
  token: ETHER_TOKEN_FAKE_ADDRESS,
  voteTime: 60000,
  PCT_BASE: 50,
  globalCandidateSupportPct: 50,
  globalMinQuorum: 50e16,
  votes: [],
}

const functions = process.env.NODE_ENV !== 'production' && ((appState, setAppState) => ({
  createVote: (
    description = 'Which deserve the most?',
    type = 'allocation'
  ) => setAppState({
    ...appState,
    votes: [
      ...appState.votes,
      {
        voteId: appState.votes.length + 1,
        data: {
          balance: 0,
          creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
          metadata: description,
          minAcceptQuorum: 0,
          options: [{
            label: '0xcaaacaaacaaacaaacaaacaaacaaacaaacaaacaaa',
            value: 0,
          }, {
            label: '0xdaaadaaadaaadaaadaaadaaadaaadaaadaaadaaa',
            value: 0,
          }],
          participationPct: 0,
          snapshotBlock: -1,
          startDate: new Date().getTime(),
          tokenSymbol: 'ETH',
          totalVoters: 0,
          type,
        }
      }
    ]
  }),
}))

const { useAragonApi, useNetwork } = buildStubbedApiReact({ initialState, functions })

export { useAragonApi, useNetwork }
