// eslint-disable-next-line import/no-unused-modules
import React from 'react'
import ReactDOM from 'react-dom'

// eslint-disable-next-line no-process-env
if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require
  const axe = require('react-axe')
  // eslint-disable-next-line no-magic-numbers
  axe(React, ReactDOM, 1000)
}

import { AragonApi } from '@aragon/api-react'
import appStateReducer from './app-state-reducer'
import App from './App'

ReactDOM.render(
  <AragonApi reducer={appStateReducer}>
    <App />
  </AragonApi>,
  document.querySelector('#dotvoting')
)
