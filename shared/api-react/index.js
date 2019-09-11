import {
  useAragonApi as useProductionApi,
  useNetwork as useProductionNetwork,
} from '@aragon/api-react'

const printWelcomeMessage = functionNames => {
  console.log( // eslint-disable-line no-console
    '%cWelcome!',
    'color: rgb(0, 203, 230); font-size: 24px'
  )
  console.log(
    '%cSome things you should know:',
    'font-size: 16px'
  )
  console.log(`
    1. Usually Aragon apps run within an iframe
    2. You're running this app in a dev environment, and loading it directly
    3. A bunch of things can't actually work in that setup, so we've set up a stubbed version of @aragon/api-react for you
    4. This stubbed version is very incomplete!
    5. You can override it with customized initialState and functions for your app
    6. You can send us pull requests with updates to the core stubbing logic
  `)
  if (functionNames.length > 0) {
    console.log('Available functions:')
    functionNames.forEach(name => {
      console.log(
        `  • %c${name}`,
        'color: rgb(0, 203, 230)'
      )
    })
    console.log('(Your app can use these, but you can also call them on `window.api` directly!)')
  }
}

export default ({ initialState = {}, functions = (() => {}) }) => {
  let useAragonApi = useProductionApi
  let useNetwork = useProductionNetwork

  if (process.env.NODE_ENV !== 'production') {
    const inIframe = () => {
      try {
        return window.self !== window.top
      } catch (e) {
        return true
      }
    }

    if (!inIframe()) {
      useAragonApi = require('./useStubbedApi')({ initialState, functions })
      useNetwork = require('./useStubbedNetwork')
      printWelcomeMessage(Object.keys(functions({}, () => {})))
    }
  }

  return { useAragonApi, useNetwork }
}
