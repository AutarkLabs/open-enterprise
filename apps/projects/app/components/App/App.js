import React from 'react'
import { hot } from 'react-hot-loader'
import { AragonApp, observe, SidePanel } from '@aragon/ui'

import { AppContent, AppTitle } from '.'

const ASSETS_URL = 'aragon-ui-assets/'

const projects = {}

class App extends React.Component {

  newProject = () => { alert('test') }

  render() {
    return (
      <AragonApp publicUrl={ASSETS_URL}>
        <AppTitle />
        <AppContent projects={projects} onNewProject={this.newProject} />
      </AragonApp>
    )
  }
}

export default hot(module)(App)
