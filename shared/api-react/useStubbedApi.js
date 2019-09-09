import { useState } from 'react'
import { Observable } from 'rxjs'
import * as localStorage from './localStorage'

const dbName = 'stubbedAragonApi'

const savedAppState = localStorage.load(dbName)

const stubbedFn = key => ([...args]) => {
  console.log( // eslint-disable-line no-console
    '%cYou are using a stubbed version of AragonApi!',
    `color: rgb(0, 203, 230); font-size: 18px`
  )
  console.log( // eslint-disable-line no-console
    `  api.%c${key}`,
    `color: rgb(251, 121, 121)`,
    'is not yet supported'
  )
  return new Observable(subscriber => {
    subscriber.next(`STUBBED-${key}(${args && JSON.stringify(args)})`)
    subscriber.complete()
  })
}

const buildHook = ({ initialState, functions }) => {
  if (!savedAppState) {
    localStorage.save(dbName, initialState)
  }

  const useStubbedAragonApi = () => {
    const [ appState, setAppStateRaw ] = useState(localStorage.load(dbName))

    const setAppState = state => {
      localStorage.save(dbName, state)
      setAppStateRaw(state)
    }

    const apiOverride = {
      cache: (key, value) => {
        const newState = {
          ...appState,
          [key]: value,
        }
        setAppState(newState)
        return value
      },
      getCache: key => {
        return appState[key]
      },
      ...functions(appState, setAppState),
    }

    const apiProxy = new Proxy(apiOverride, {
      get: (target, key) => (key in target ? target[key] : stubbedFn(key)),
      has: () => true,
    })

    return {
      api: apiProxy,
      appState,
      connectedAccount: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    }
  }

  return useStubbedAragonApi
}

module.exports = buildHook
