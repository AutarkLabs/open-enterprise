import { useCallback, useMemo, } from 'react'
import { usePath } from '@aragon/api-react'

const PATH_REGEX = /^\/(settings|issues)(?:\/([a-zA-Z0-9=]{24})?)?(?:\/)?$/
const TABS = [ 'overview', 'issues', 'settings' ]

export default function usePathSegments() {
  const [ path, requestPath ] = usePath()
  const fromPath = useMemo(() => {
    const [ , tab, selectedIssueId ] = path.match(PATH_REGEX) || []

    const pathSegments = {
      selectedTab: tab ? TABS.indexOf(tab) : 0,
      selectedIssueId,
    }

    return pathSegments
  }, [path])

  const selectTab = useCallback(tabIndex => {
    const tab = TABS[tabIndex]
    requestPath((!tabIndex || tabIndex < 1) ? '' : `/${tab}`)
  }, [requestPath])

  const selectIssue = useCallback(issueId => {
    requestPath && requestPath(`/issues/${issueId || ''}`)
  }, [requestPath])

  return { fromPath, selectIssue, selectTab }
}
