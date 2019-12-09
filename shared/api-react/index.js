import React from 'react'
import { Router } from 'react-router'
import PropTypes from 'prop-types'
import {
  AragonApi,
  usePath,
  useAragonApi as useProductionApi,
  useNetwork as useProductionNetwork,
} from '@aragon/api-react'

const usePrevious = val => {
  const ref = React.useRef()
  React.useEffect(() => {
    ref.current = val
  })
  return ref.current
}

// from https://github.com/ReactTraining/history/blob/master/modules/PathUtils.js
function parsePath(path) {
  let pathname = path || '/'
  let search = ''
  let hash = ''

  const hashIndex = pathname.indexOf('#')
  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex)
    pathname = pathname.substr(0, hashIndex)
  }

  const searchIndex = pathname.indexOf('?')
  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex)
    pathname = pathname.substr(0, searchIndex)
  }

  return {
    pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
  }
}

class AragonHistory {
  constructor(path, requestPath) {
    this.path = path
    this.requestPath = requestPath
    this.location = {
      ...parsePath(path),

      // do we want to support these?
      // key: 'randomString',
      // state: undefined,
    }
    this.listeners = []
    this.appendListener = this.appendListener.bind(this)
    this.listen = this.listen.bind(this)
    this.notifyListeners = this.notifyListeners.bind(this)
    this.go = this.go.bind(this)
    this.push = this.push.bind(this)
    this.replace = this.replace.bind(this)
    this.setRequestPath = this.setRequestPath.bind(this)
  }
  appendListener(fn) {
    function listener(...args) {
      fn(...args)
    }
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(item => item !== listener)
    }
  }
  listen(fn) {
    return this.appendListener(fn)
  }
  notifyListeners(...args) {
    this.listeners.forEach(listener => listener(...args))
  }
  go(val) {
    if (typeof val === 'object') {
      this.requestPath && this.requestPath(val.pathname + val.search + val.hash)
      this.location = val
    } else {
      this.requestPath && this.requestPath(val)
      this.location = parsePath(val)
    }
    const action = {} // need to pass action to notifyListeners for it to behave properly; not sure if it needs to have a real value
    this.notifyListeners(this.location, action)
  }
  push(val) {
    this.go(val)
  }
  // requestPath does not support replace
  replace(val) {
    this.go(val)
  }
  setRequestPath(newRequestPath) {
    this.requestPath = newRequestPath
  }
}

const createProductionHistory = ({ path, requestPath }) => {
  return new AragonHistory(path, requestPath)
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
