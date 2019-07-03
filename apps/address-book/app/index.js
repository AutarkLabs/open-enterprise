import React from 'react'
import ReactDOM from 'react-dom'
import { AragonApi } from '@aragon/api-react'
import appStateReducer from './app-state-reducer'
import App from './components/App/App'

ReactDOM.render(
  <AragonApi reducer={appStateReducer}>
    <App />
  </AragonApi>,
  document.querySelector('#addressbook')
)