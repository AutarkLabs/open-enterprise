import React from 'react'
import PropTypes from 'prop-types'
import usePathHelpers from '../../../shared/utils/usePathHelpers'

import { Bounties, General, ProjectDetail, Settings } from './components/Content'
import IssueDetail from './components/Content/IssueDetail'

export default function Routes({ handleGithubSignIn }) {
  const { parsePath } = usePathHelpers()

  const { issueId } = parsePath('^/issues/:issueId')
  if (issueId) return <IssueDetail issueId={issueId} />

  const { repoId } = parsePath('^/projects/:repoId')
  if (repoId) return <ProjectDetail repoId={repoId} />

  const { tab } = parsePath('^/:tab')
  if (tab === 'bounties') return <Bounties />
  if (tab === 'settings') return <Settings onLogin={handleGithubSignIn} />

  return <General />
}

Routes.propTypes = {
  handleGithubSignIn: PropTypes.func.isRequired,
}
