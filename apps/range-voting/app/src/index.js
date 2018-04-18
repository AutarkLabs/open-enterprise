import React from 'react'
import {render} from 'react-dom'
import App from './components/App'

const Root = () => {
  return (
    <App />
  )
}

render(<Root />, document.querySelector('#main'))
