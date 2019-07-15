import { useState } from 'react'
import { Observable } from 'rxjs'
import { theme } from '@aragon/ui'
import * as localStorage from './localStorage'
import initialAppState from './mockedAppState'
import {
  initializeGraphQLClient,
  getRepoData,
} from '../store/helpers'

const dbName = 'stubbedAragonApi'

const savedAppState = localStorage.load(dbName)

if (!savedAppState) {
  localStorage.save(dbName, initialAppState)
}

const stubbedFn = key => ([...args]) => {
  console.log( // eslint-disable-line no-console
    '%cYou are using a stubbed version of AragonApi!',
    `color: ${theme.accent}; font-size: 18px`
  )
  console.log( // eslint-disable-line no-console
    `  api.%c${key}`,
    `color: ${theme.negative}`,
    'is not yet supported'
  )
  return new Observable(subscriber => {
    subscriber.next(`STUBBED-${key}(${args && JSON.stringify(args)})`)
    subscriber.complete()
  })
}

const useStubbedApi = () => {
  const [ appState, setAppState ] = useState(localStorage.load(dbName))

  const apiOverride = {
    cache: (key, value) => {
      const newState = {
        ...appState,
        [key]: value,
      }
      localStorage.save(dbName, newState)
      setAppState(newState)
      return value
    },
    getCache: key => {
      return appState[key]
    },
    addRepo: async repoIdHex => {
      const { token } = appState.github
      if (!token) return

      initializeGraphQLClient(token)
      const { _repo, ...metadata } = await getRepoData(repoIdHex)

      const newState = {
        ...appState,
        repos: [
          ...appState.repos,
          {
            id: repoIdHex,
            metadata,
            data: {
              _repo,
              index: undefined,
            },
          },
        ]
      }

      localStorage.save(dbName, newState)
      setAppState(newState)
    }
  }

  const apiProxy = new Proxy(apiOverride, {
    get: (target, key) => (key in target ? target[key] : stubbedFn(key)),
    has: () => true,
  })

  return {
    displayMenuButton: false,
    api: apiProxy,
    appState,
  }
}

module.exports = useStubbedApi
