import React from 'react'
import ReactDOM from 'react-dom'
import Aragon, { providers } from '@aragon/api'
import ApolloClient from 'apollo-boost'
import { pluck } from 'rxjs/operators'

import App from './components/App/App'

import { CURRENT_USER } from './utils/gql-queries'

// import { projectsMockData } from './utils/mockData'

// if (process.env.NODE_ENV !== 'production') {
//   const { whyDidYouUpdate } = require('why-did-you-update')
//   whyDidYouUpdate(React)
// }

const initApolloClient = (token) =>
  new ApolloClient({
    uri: 'https://api.github.com/graphql',
    request: operation => {
      if (token) {
        operation.setContext({
          headers: {
            accept: 'application/vnd.github.starfire-preview+json', // needed to create issues
            authorization: `bearer ${token}`,
          },
        })
      }
    }
  })


// TODO: Convert to stateless functional component
class ConnectedApp extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      app: new Aragon(new providers.WindowMessage(window.parent)),
      network: {},
      observable: null,
      userAccount: '',
      client: initApolloClient(),
    }
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
        .pipe(pluck('result'))
        .subscribe(github => {
          console.log('github object received from backend cache:', github)

          if (github.token) {
            const client = initApolloClient(github.token)

            client
              .query({
                query: CURRENT_USER,
              })
              .then(({ data }) => {
                this.setState({
                  client,
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
