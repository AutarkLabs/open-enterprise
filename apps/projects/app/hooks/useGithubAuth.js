import { useEffect, useState } from 'react'
import { useAragonApi } from '@aragon/api-react'
import { initApolloClient } from '../utils/apollo-client'
import { CURRENT_USER } from '../utils/gql-queries'

const useGithubAuth = () => {
  const { appState } = useAragonApi()
  const token = appState.github && appState.github.token

  const [ githubCurrentUser, setGithubCurrentUser ] = useState({})
  const [ client, setClient ] = useState(initApolloClient(token))

  useEffect(() => {
    setClient(initApolloClient(token))
    client
      .query({ query: CURRENT_USER })
      .then(res => setGithubCurrentUser(res.data.viewer))
  }, [token])

  return { githubCurrentUser, client }
}

export default useGithubAuth
