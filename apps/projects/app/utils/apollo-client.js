import ApolloClient from 'apollo-boost'
import { useAragonApi } from '../api-react'
import { GITHUB_TOKEN_REVOKED } from '../store/eventTypes'
import { STATUS } from '../utils/github'

export const useApolloClient = () => {
  const {
    api,
    appState: {
      github: { token } = { token: null }
    }
  } = useAragonApi()
  if (token === null) return null
  return new ApolloClient({
    uri: 'https://api.github.com/graphql',
    request: operation => {
      operation.setContext({
        headers: {
          accept: 'application/vnd.github.starfire-preview+json', // needed to create issues
          authorization: `bearer ${token}`,
        },
      })
    },
    onError: error => {
      if (error.networkError && error.networkError.statusCode === 401) {
        api.emitTrigger(GITHUB_TOKEN_REVOKED, {
          status: STATUS.REVOKED,
          scope: null,
          token: null,
        })
      }
      else console.error(error)
    }
  })
}
