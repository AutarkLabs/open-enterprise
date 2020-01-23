// eslint-disable-next-line import/no-unused-modules
import React from 'react'
import ReactDOM from 'react-dom'
import { AppLogicProvider } from './app-logic'

// if (process.env.NODE_ENV !== 'production') {
//   var axe = require('react-axe')
//   axe(React, ReactDOM, 1000)
// }

import App from './App'

ReactDOM.render(
  <AppLogicProvider>
    <App />
  </AppLogicProvider>,
  document.querySelector('#dot-voting')
)
