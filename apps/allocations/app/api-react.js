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
  allocations:
  [
    {
      date: String(new Date().getTime()),
      budget: 'Marketing',
      recipients: [
        {
          address: '0x75428BE833EFcAA951A466Ac58Db78A34B79104d',
          amount: String(8e18),
        },
        {
          address: '0x6635F83421Bf059cd8111f180f0727128685BaE4',
          amount: String(4e18),
        }
      ],
      description: 'Some important stuff',
      status: 0,
      amount: String(15e18),
      token: 'ETH'
    },
    {
      date: String(new Date().getTime()),
      budget: 'Hacktivism',
      recipients: [{
        address: '0x75428BE833EFcAA951A466Ac58Db78A34B79104d',
        amount: String(14e18),
      }],
      description: 'Fight against climate change',
      status: 1,
      amount: String(25e18),
      token: 'ETH'
    },
    {
      date: String(new Date().getTime()),
      budget: 'Offsites',
      recipients: [{
        address: '0x75428BE833EFcAA951A466Ac58Db78A34B79104d',
        amount: String(800e18),
      }],
      description: 'Is but yes',
      status: 2,
      amount: String(4500e18),
      token: 'DAI'
    },
    {
      date: String(new Date().getTime()),
      budget: 'Equipment',
      recipients: [{
        address: '0x75428BE833EFcAA951A466Ac58Db78A34B79104d',
        amount: String(800e18),
      }],
      description: 'Best money can get',
      status: 3,
      amount: String(4500e18),
      token: 'DAI'
    },
  ]
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

const { AragonApi, AragonRouter, useAragonApi } = buildStubbedApiReact({ initialState, functions })

export { AragonApi, AragonRouter, useAragonApi }
