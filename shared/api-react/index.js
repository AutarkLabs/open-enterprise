import React from 'react'
import { Router } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  AragonApi,
  usePath,
  useAragonApi as useProductionApi,
  useNetwork as useProductionNetwork,
} from '@aragon/api-react'
import createProductionHistory from './createAragonHistory'

const usePrevious = val => {
  const ref = React.useRef()
  React.useEffect(() => {
    ref.current = val
  })
  return ref.current
}

export default ({ initialState = {}, functions = (() => {}) }) => {
  let useAragonApi = useProductionApi
  let useNetwork = useProductionNetwork
  let createHistory = createProductionHistory

  if (process.env.NODE_ENV !== 'production') {
    const inIframe = () => {
      try {
        return window.self !== window.top
      } catch (e) {
        return true
      }
    }

    if (!inIframe()) {
      useAragonApi = require('./useStubbedApi')({ initialState, functions })
      useNetwork = require('./useStubbedNetwork')
      createHistory = require('history').createBrowserHistory
    }
  }

  const AragonRouter = props => {
    const [ path, requestPath ] = usePath()

    const history = React.useRef(createHistory({ ...props, path, requestPath }))

    const oldPath = usePrevious(path)
    if (oldPath && oldPath !== path) {
      history.current.push(path)
    }

    const oldRequestPath = usePrevious(requestPath)
    React.useEffect(() => {
      if (!oldRequestPath && requestPath && history.current.setRequestPath) {
        history.current.setRequestPath(requestPath)
      }
    }, [requestPath])

    return (
      <Router history={history.current}>
        {props.children}
      </Router>
    )
  }

  if (process.env.NODE_ENV !== 'production') {
    AragonRouter.propTypes = {
      basename: PropTypes.string,
      children: PropTypes.node,
      getUserConfirmation: PropTypes.func,
    }
  }

  return { AragonApi, AragonRouter, useAragonApi, useNetwork }
}
