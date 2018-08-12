import React from 'react'
import { hot } from 'react-hot-loader'
import { AragonApp } from '@aragon/ui'

import { AppContent, AppTitle } from '.'
import { GithubContext } from '../../context'

const ASSETS_URL = 'aragon-ui-assets/'

const github = {
  // authToken: '',
  login: '',
  // avatarUrl: '',
  // isAuthenticated: 'true',
  // activeRepo: '',
  // activeLabel: '',
  // activeMilestone: '',
  // reposToAdd: {},
  // reposFromServer: {},
  // reposManaged: {}, // to be populated from contract or git backend itself,
  // err: '',
  //    reposManaged: getPreprocessedRepos(), // to be populated from contract or git backend itself
}

const ProjectsApp = () => (
  // TODO: Add update detector to clean unneded renders
  // TODO: enable <React.StrictMode> to find react lifecycle quirks
  <AragonApp publicUrl={ASSETS_URL}>
    <GithubContext.Provider value={github}>
      <AppTitle />
      <AppContent />
    </GithubContext.Provider>
  </AragonApp>
)

export default hot(module)(ProjectsApp)
