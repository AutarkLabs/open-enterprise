import buildStubbedApiReact from '../../../shared/api-react'

const initialState = process.env.NODE_ENV !== 'production' && {
}

const functions = process.env.NODE_ENV !== 'production' && ((appState, setAppState) => ({
}))

const { AragonApi, useAragonApi, useNetwork } = buildStubbedApiReact({ initialState, functions })

export { AragonApi, useAragonApi, useNetwork }
