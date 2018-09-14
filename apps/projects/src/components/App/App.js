import React from 'react'
import { hot } from 'react-hot-loader'
import { AragonApp } from '@aragon/ui'

import { AppContent, AppTitle } from '.'

const ASSETS_URL = 'aragon-ui-assets/'

const ProjectsApp = () => (
  // TODO: Add update detector to clean unneded renders
  // TODO: enable <React.StrictMode> to find react lifecycle quirks
  <AragonApp publicUrl={ASSETS_URL}>
    <AppTitle />
    <AppContent />
  </AragonApp>
)

export default hot(module)(ProjectsApp)
