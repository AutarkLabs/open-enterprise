import React from 'react'
import ReactDOM from 'react-dom'

if (process.env.NODE_ENV !== 'production') {
  var axe = require('react-axe')
  axe(React, ReactDOM, 1000)
}

import { AragonApi } from '@aragon/api-react'
import App from './App'

ReactDOM.render(
  <AragonApi>
    <App />
  </AragonApi>,
  document.querySelector('#dotvoting')
)
