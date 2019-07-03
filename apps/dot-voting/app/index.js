import React from 'react'
import ReactDOM from 'react-dom'
import { AragonApi } from '@aragon/api-react'
import App from './App'

ReactDOM.render(
  <AragonApi>
    <App />
  </AragonApi>,
  document.querySelector('#dotvoting')
)
