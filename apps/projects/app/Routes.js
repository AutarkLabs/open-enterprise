import React from 'react'
import PropTypes from 'prop-types'
import usePathHelpers from '../../../shared/utils/usePathHelpers'

import { Bounties, General, ProjectDetail, Settings } from './components/Content'
import IssueDetail from './components/Content/IssueDetail'
import { useDecoratedRepos } from './context/DecoratedRepos'

export default function Routes({ handleGithubSignIn }) {
  const { parsePath } = usePathHelpers()
  const repos = useDecoratedRepos()

  const { issueId } = parsePath('^/issues/:issueId')
  if (issueId) return <IssueDetail issueId={issueId} />

  const { repoId } = parsePath('^/projects/:repoId')
  const repo = React.useMemo(() => {
    return repos.find(r => r.data._repo === repoId)
  }, [ repos, repoId ])
  if (repo) return <ProjectDetail repo={repo} />

  const { tab } = parsePath('^/:tab')
  if (tab === 'bounties') return <Bounties />
  if (tab === 'settings') return <Settings onLogin={handleGithubSignIn} />

  return <General />
}

Routes.propTypes = {
  handleGithubSignIn: PropTypes.func.isRequired,
}
