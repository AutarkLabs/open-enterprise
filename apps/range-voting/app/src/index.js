import React from 'react'
import {render} from 'react-dom'
import App from './App'

const Root = () => {
  return (
    <App />
  )
}

render(<Root />, document.querySelector('#main'))
