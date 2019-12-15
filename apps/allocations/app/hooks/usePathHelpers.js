import React from 'react'
import { usePath } from '../api-react'

export default function usePathHelpers() {
  const [ path, requestPath ] = usePath()
  const [ firstTry, setFirstTry ] = React.useState(true)

  // accepts a pattern like '/budgets/:id', where ':id' is a named parameter
  // redirects to '/' if the current path doesn't match at all
  // otherwise, returns an object with keys matching the named parameters and
  // values filled in from the current path
  const parsePath = React.useCallback(pattern => {
    const namedParameters = pattern.match(/(:[a-zA-Z]+)/g)

    // replace named paramaters with regex-compatible capture groups
    namedParameters.forEach(x => {
      pattern = pattern.replace(x, '([a-zA-Z0-9=-]+)')
    })

    const matchData = path.match(pattern)
    if (!matchData) {
      requestPath('/')
      return {}
    }

    const groups = namedParameters.reduce(
      (acc, namedParameter, index) => {
        acc[namedParameter.slice(1)] = matchData[index + 1]
        return acc
      },
      {}
    )

    return groups
  }, [ path, requestPath ])

  // if this page is the first page loaded for the user,
  // we may still have incomplete state from aragonAPI;
  // let's give it a second before redirecting
  const patientlyRequestPath = React.useCallback(path => {
    if (firstTry) {
      setTimeout(() => setFirstTry(false), 1000)
    } else {
      requestPath(path)
    }
  }, [ firstTry, path, requestPath ])

  return {
    path,
    parsePath,
    patientlyRequestPath,
    requestPath,
  }
}

