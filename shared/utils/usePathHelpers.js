import React from 'react'
import { usePath } from '@aragon/api-react'

const SEARCH_REGEX = /\?(.+)($|#)/ // everything between ? and end-of-line or a hash sign
const SEARCH_PARAM_REGEX = /([a-zA-Z0-9]+)=([a-zA-Z0-9=]+)/

export default function usePathHelpers() {
  const [ path, requestPath ] = usePath()

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

  const search = React.useMemo(() => {
    return (path.match(SEARCH_REGEX) || [])[1]
  }, [path])

  const query = React.useMemo(() => {
    if (!search) return {}

    return search.split('&').reduce(
      (acc, param) => {
        const [ , key, value ] = param.match(SEARCH_PARAM_REGEX)
        acc[key] = value
        return acc
      },
      {}
    )
  }, [search])


  return { parsePath, requestPath, query }
}

