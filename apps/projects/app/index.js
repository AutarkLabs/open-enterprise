import React from 'react'
import ReactDOM from 'react-dom'
import Aragon, { providers } from '@aragon/api'
import ApolloClient from 'apollo-boost'

import App from './components/App/App'

import { CURRENT_USER } from './utils/gql-queries'

// import { projectsMockData } from './utils/mockData'

// if (process.env.NODE_ENV !== 'production') {
//   const { whyDidYouUpdate } = require('why-did-you-update')
//   whyDidYouUpdate(React)
// }

// TODO: Convert to stateless functional component
class ConnectedApp extends React.Component {
  state = {
    app: new Aragon(new providers.WindowMessage(window.parent)),
    network: {},
    observable: null,
    userAccount: '',
    // ...projectsMockData,
    github: { token: null },
    client: new ApolloClient({
      uri: 'https://api.github.com/graphql',
      request: operation => {
        const { token } = this.state.github
        if (token) {
          operation.setContext({
            headers: {
              accept: 'application/vnd.github.starfire-preview+json', // needed to create issues
              authorization: `bearer ${token}`,
            },
          })
        }
      },
    }),
  }
  componentDidMount() {
    window.addEventListener('message', this.handleWrapperMessage)
  }
  componentWillUnmount() {
    window.removeEventListener('message', this.handleWrapperMessage)
  }
  // handshake between Aragon Core and the iframe,
  // since iframes can lose messages that were sent before they were ready
  handleWrapperMessage = ({ data }) => {
    const { app } = this.state
    if (data.from !== 'wrapper') {
      return
    }
    if (data.name === 'ready') {
      this.sendMessageToWrapper('ready', true)
      this.setState({
        observable: app.state(),
      })
      app.accounts().subscribe(accounts => {
        this.setState({ userAccount: accounts[0] || '' })
      })
      app.network().subscribe(network => {
        this.setState({ network })
      })
      app.rpc
        .sendAndObserveResponses('cache', [ 'get', 'github' ])
        .pluck('result')
        .subscribe(github => {
          console.log('github object received from backend cache:', github)

          this.setState({
            github: github,
          })

          if (this.state.github.token) {
            this.state.client
              .query({
                query: CURRENT_USER,
              })
              .then(({ data }) => {
                this.setState({
                  githubCurrentUser: data.viewer,
                })
                console.log('viewer: ', data)
              })
          }
        })
    }
  }
  sendMessageToWrapper = (name, value) => {
    window.parent.postMessage({ from: 'app', name, value }, '*')
  }
  render() {
    return <App {...this.state} />
  }
}
// module.hot.accept(
ReactDOM.render(<ConnectedApp />, document.getElementById('projects'))
// )
