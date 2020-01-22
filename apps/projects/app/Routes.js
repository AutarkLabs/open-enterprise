import React from 'react'
import PropTypes from 'prop-types'
import usePathHelpers from '../../../shared/utils/usePathHelpers'

import { Issues, General, Settings } from './components/Content'
import IssueDetail from './components/Content/IssueDetail'

export default function Routes({ handleGithubSignIn }) {
  const { parsePath } = usePathHelpers()

  const { issueId } = parsePath('^/issues/:issueId')
  if (issueId) return <IssueDetail issueId={issueId} />

  const { tab } = parsePath('^/:tab')
  if (tab === 'issues') return <Issues />
  if (tab === 'settings') return <Settings onLogin={handleGithubSignIn} />

  return <General />
}

Routes.propTypes = {
  handleGithubSignIn: PropTypes.func.isRequired,
}
