import buildStubbedApiReact from '../../../shared/api-react'

const initialState = process.env.NODE_ENV !== 'production' && {
  accounts: [{
    accountId: '0',
    data: {
      metadata: 'Dummy Allocator',
      proxy: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
      balance: String(100e18),
    }
  }],
  balances: [
    String(1e18),
    String(20e18),
    String(30e18),
    String(40e18),
    String(50e18),
    String(60e18),
    String(70e18),
    String(80e18),
    String(90e18),
  ],
  entries: [],
  payouts: [{
    candidateKeys: [
      '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
    ],
    candidateAddresses: [
      '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
    ],
    supports: [
      String(50e18),
    ],
    metadata: 'Dummy Allocation',
    token: '0x0000000000000000000000000000000000000000',
    recurring: false,
    period: String(new Date().getTime()),
    amount: String(5e18),
    startTime: String(new Date().getTime()),
    distSet: false,
    description: 'Our first allocation.\n\nCool.',
  }],
}

const functions = process.env.NODE_ENV !== 'production' && ((appState, setAppState) => ({
  newAccount: description => setAppState({
    ...appState,
    accounts: [
      ...appState.accounts,
      {
        accountId: String(appState.accounts.length + 1),
        data: {
          metadata: description,
          proxy: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
          balance: String(100e18),
        }
      }
    ]
  }),
}))

const { AragonApi, useAragonApi, useNetwork } = buildStubbedApiReact({ initialState, functions })

export { AragonApi, useAragonApi, useNetwork }
