import React from 'react'
import { usePath } from '@aragon/api-react'

const history = []

export default function usePathHelpers() {
  const [ path, requestPath ] = usePath()

  React.useEffect(() => {
    if (path !== history[history.length - 1]) {
      history.push(path)
    }
  }, [path])

  // Since goBack is not supported in aragonAPI, we do not have access to
  // actual browser history. If the user refreshes their page then fires a
  // `goBack` action, we will have nothing in our custom `history` array.
  // The `fallback` option allows us to work around this.
  const goBack = React.useCallback(({ fallback = '/' }) => {
    history.pop() // remove current page, forget about it (goForward not supported)
    const prev = history.pop()
    requestPath(prev || fallback)
  }, [requestPath])

  // accepts a pattern like '/budgets/:id', where ':id' is a named parameter
  // redirects to '/' if the current path doesn't match at all
  // otherwise, returns an object with keys matching the named parameters and
  // values filled in from the current path
  const parsePath = React.useCallback(pattern => {
    const namedParameters = pattern.match(/(:[a-zA-Z]+)/g)

    // replace named paramaters with regex-compatible capture groups
    //console.log('regex: ', pattern, namedParameters, path)
    namedParameters.forEach(x => {
      pattern = pattern.replace(x, '([a-zA-Z0-9=-_]+)')
    })

    const matchData = path.match(pattern)
    if (!matchData) return {}

    const groups = namedParameters.reduce(
      (acc, namedParameter, index) => {
        acc[namedParameter.slice(1)] = matchData[index + 1]
        return acc
      },
      {}
    )

    return groups
  }, [ path, requestPath ])

  return { goBack, parsePath, requestPath }
}

