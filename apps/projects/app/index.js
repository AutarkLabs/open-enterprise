/* eslint-disable import/no-unused-modules */
import React from 'react'
import ReactDOM from 'react-dom'

// if (process.env.NODE_ENV !== 'production') {
//   var axe = require('react-axe')
//   axe(React, ReactDOM, 1000, {
//     rules: [{
//       id: 'skip-link',
//       enabled: false,
//     }]
//   })
// }

import { AragonApi } from './api-react'
import appStateReducer from './app-state-reducer'
import App from './App'

ReactDOM.render(
  <AragonApi reducer={appStateReducer}>
    <App />
  </AragonApi>,
  document.querySelector('#projects')
)
