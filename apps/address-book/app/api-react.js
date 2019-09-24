import buildStubbedApiReact from '../../../shared/api-react'

const initialState = process.env.NODE_ENV !== 'production' && {
  entries: [
    {
      addr: '0x12302fE9c02ff50939BaAaaf415fc226C078613C',
      data: {
        name: 'Lyra Belacqua',
        type: 'Individual',
      }
    }
  ]
}

const functions = process.env.NODE_ENV !== 'production' && ((appState, setAppState) => ({
  addEntry: (address, cid) => setAppState({
    ...appState,
    entries: [
      ...appState.entries,
      {
        addr: address,
        data: {
          name: 'Emilio Silva Schlenker',
          type: 'Individual'
        }
      }
    ],
  })
}))

const { AragonApi, useAragonApi, useNetwork } = buildStubbedApiReact({ initialState, functions })

export { AragonApi, useAragonApi, useNetwork }
