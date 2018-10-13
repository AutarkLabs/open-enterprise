import React from 'react'
import ReactDOM from 'react-dom'
import Aragon, { providers } from '@aragon/client'

import { allocationsMockData } from './utils/mockData'
import { App } from './components/App'

// if (process.env.NODE_ENV !== 'production') {
//   const { whyDidYouUpdate } = require('why-did-you-update')
//   whyDidYouUpdate(React)
// }

// TODO: Convert to stateless functional component
class ConnectedApp extends React.Component {
  state = {
    app: new Aragon(new providers.WindowMessage(window.parent)),
    observable: null,
    userAccount: '',
    // ...allocationsMockData
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
    if (data.from !== 'wrapper') {
      return
    }
    if (data.name === 'ready') {
      const { app } = this.state
      console.log('received a ready from the wrapper')
      this.sendMessageToWrapper('ready', true)
      this.setState({
        observable: app.state(),
      })
      app.accounts().subscribe(accounts => {
        this.setState({
          userAccount: accounts[0],
        })
      })
      app.cache('state', [])      
    }
  }
  sendMessageToWrapper = (name, value) => {
    console.log('Sending message to wrapper')
    window.parent.postMessage({ from: 'app', name, value }, '*')
    
  }
  render() {
    return <App {...this.state} />
  }
}
ReactDOM.render(<ConnectedApp />, document.getElementById('allocations'))
