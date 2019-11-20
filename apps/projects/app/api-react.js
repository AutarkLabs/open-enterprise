import { hexToAscii } from 'web3-utils'
import buildStubbedApiReact from '../../../shared/api-react'
import {
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_DISCONNECT,
} from './store/eventTypes'
import { INITIAL_STATE } from './store/index'

const initialState = process.env.NODE_ENV !== 'production' && {
  repos: [],
  tokens: [
    {
      addr: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      decimals: '18',
      balance: '0',
    },
    {
      addr: '0xB1Aa712237895EF25fb8c6dA491Ba8662bB80256',
      symbol: 'autark',
      decimals: '18',
      balance: '100000000000000000000',
    },
  ],
  issues: [],
  bountySettings: {
    '0': [ '100', '300', '500' ],
    '1': [
      '0x426567696e6e6572000000000000000000000000000000000000000000000000',
      '0x496e7465726d6564696174650000000000000000000000000000000000000000',
      '0x416476616e636564000000000000000000000000000000000000000000000000',
    ],
    '2': '100',
    '3': '336',
    '4': '0xB1Aa712237895EF25fb8c6dA491Ba8662bB80256',
    '5': '0xfa673d57F7f372976a358F8dAD672F99b891e9fB',
    expMultipliers: [ '100', '300', '500' ],
    expLevels: [
      '0x426567696e6e6572000000000000000000000000000000000000000000000000',
      '0x496e7465726d6564696174650000000000000000000000000000000000000000',
      '0x416476616e636564000000000000000000000000000000000000000000000000',
    ],
    baseRate: 1,
    bountyDeadline: '336',
    bountyCurrency: '0xB1Aa712237895EF25fb8c6dA491Ba8662bB80256',
    bountyAllocator: '0xfa673d57F7f372976a358F8dAD672F99b891e9fB',
    expLvls: [
      { mul: 1, name: 'Beginner' },
      { mul: 3, name: 'Intermediate' },
      { mul: 5, name: 'Advanced' },
    ],
    fundingModel: 'Fixed',
  },
  github: INITIAL_STATE.github,
  isSyncing: false,
}

const functions = process.env.NODE_ENV !== 'production' && ((appState, setAppState) => ({
  addRepo: repoIdHex => setAppState({
    ...appState,
    repos: [
      ...appState.repos,
      {
        id: repoIdHex,
        data: { _repo: hexToAscii(repoIdHex) },
      },
    ]
  }),
  emitTrigger: (event, { status, token }) => {
    switch (event) {
    case REQUESTED_GITHUB_TOKEN_SUCCESS:
      setAppState({
        ...appState,
        github: { token, status, event: null },
      })
      break
    case REQUESTED_GITHUB_DISCONNECT:
      setAppState({
        ...appState,
        github: INITIAL_STATE.github,
      })
    }
  }
}))

const { AragonApi, useAragonApi, useNetwork } = buildStubbedApiReact({ initialState, functions })

export { AragonApi, useAragonApi, useNetwork }
