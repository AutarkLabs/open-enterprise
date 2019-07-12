import {
  useAragonApi as useProductionApi,
  useNetwork as useProductionNetwork,
} from '@aragon/api-react'

let useAragonApi = useProductionApi
let useNetwork = useProductionNetwork

if (process.env.NODE_ENV !== 'production') {
  const inIframe = () => {
    try {
      return window.self !== window.top
    } catch (e) {
      return true
    }
  }

  if (!inIframe()) {
    useAragonApi = require('./useStubbedApi')
    useNetwork = require('./useStubbedNetwork')
  }
}

export { useAragonApi, useNetwork }
