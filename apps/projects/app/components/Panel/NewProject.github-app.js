import React from 'react'
import ApolloClient from 'apollo-boost'
import { ApolloProvider } from 'react-apollo'

const CLIENT_ID = 'd556542aa7a03e640409'
const REDIRECT_URI = 'http://localhost:1234/'
const AUTH_API_URI = 'http://localhost:9999/authenticate/'

const STATUS = {
  INITIAL: 'initial',
  LOADING: 'loading',
  FINISHED_LOADING: 'finished_loading',
  AUTHENTICATED: 'authenticated',
}

const client = new ApolloClient({
  uri: 'https://api.github.com/graphql',
  request: operation => {
    const token = localStorage.getItem('github_token')
    if (token) {
      operation.setContext({
        headers: {
          authorization: `Bearer ${token}`,
        },
      })
    }
  },
})

class NewProject extends React.Component {
  state = {
    status: STATUS.INITIAL,
    token: null,
  }

  componentDidMount() {
    const storedToken = localStorage.getItem('github_token')
    if (storedToken) {
      this.setState({
        token: storedToken,
        status: STATUS.AUTHENTICATED,
      })
      return
    }
    const code =
      window.location.href.match(/\?code=(.*)/) &&
      window.location.href.match(/\?code=(.*)/)[1]
    if (code) {
      this.setState({ status: STATUS.LOADING })
      fetch(`${AUTH_API_URI}${code}`)
        .then(response => response.json())
        .then(({ token }) => {
          localStorage.setItem('github_token', token)
          this.setState({
            token,
            status: STATUS.FINISHED_LOADING,
          })
        })
    }
  }

  render() {
    return (
      <ApolloProvider client={client}>
        <a
          style={{
            display: this.state.status === STATUS.INITIAL ? 'inline' : 'none',
          }}
          href={`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=user&redirect_uri=${REDIRECT_URI}`}
        >
          Login
        </a>
      </ApolloProvider>
    )
  }
}

export default NewProject
