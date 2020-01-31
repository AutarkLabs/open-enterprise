import React from 'react'
import PropTypes from 'prop-types'
import usePathHelpers from '../../../shared/utils/usePathHelpers'

import { Bounties, General, ProjectDetail, Settings } from './components/Content'
import IssueDetail from './components/Content/IssueDetail'
import { useDecoratedRepos } from './context/DecoratedRepos'

export default function Routes({ handleGithubSignIn }) {
  const { parsePath } = usePathHelpers()
  const repos = useDecoratedRepos()

  const { repoId } = parsePath('^/projects/:repoId')
  const repo = React.useMemo(() => {
    return repos.find(r => {
      if(r.decoupled){
        return r.id === repoId
      }
      return r.data._repo === repoId
    })
  }, [ repos, repoId ])
  if (repo) return <ProjectDetail repo={repo} />

  const { issueId } = parsePath('^/issues/:issueId')
  if (issueId) return <IssueDetail issueId={issueId} />

  const { tab } = parsePath('^/:tab')
  if (tab === 'bounties') return <Bounties />
  if (tab === 'settings') return <Settings onLogin={handleGithubSignIn} />

  return <General />
}

Routes.propTypes = {
  handleGithubSignIn: PropTypes.func.isRequired,
}
