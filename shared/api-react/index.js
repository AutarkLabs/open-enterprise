import React from 'react'
import { Router } from 'react-router'
import PropTypes from 'prop-types'
import {
  AragonApi,
  useAragonApi as useProductionApi,
  useNetwork as useProductionNetwork,
} from '@aragon/api-react'

// TODO: implement createAragonHistory using usePath hook
import { createHashHistory as createProductionHistory } from 'history'

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
      // createHistory = require('history').createHashHistory
    }
  }

  const AragonRouter = props => {
    const history = React.useRef(createHistory(props))

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
