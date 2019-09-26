import buildStubbedApiReact from '../../../shared/api-react'

const initialState = process.env.NODE_ENV !== 'production' && {
  displayMenuButton: true,
  balances: [
    {
      amount: 10
    }
  ],
  refTokens: [
    {
      address: '0x08C31473A219F22922F47f001611d8bac62fBB6d',
      name: 'Ether',
      symbol: 'ETH',
      verified: true,
      startBlock: true,
    },
    {
      address: '0x08C31473A219F22922F47f001611d8bac62fBB6d',
      name: 'Dai',
      symbol: 'DAI',
      verified: true,
      startBlock: true,
    },
  ],
  amountTokens: [
    {
      symbol: 'ETH',
      balance: '3.14',
    },
    {
      symbol: 'BNB',
      balance: '12.63',
    },
    {
      symbol: 'LEO',
      balance: '4986.35',
    },
    {
      symbol: 'HT',
      balance: '0.32',
    },
    {
      symbol: 'LINK',
      balance: '10',
    },
  ],
}

const functions = process.env.NODE_ENV !== 'production' && (() => ({
}))

const { AragonApi, useAragonApi, useNetwork } = buildStubbedApiReact({ initialState, functions })

export { AragonApi,  useAragonApi, useNetwork }
