import React from 'react'
import { hot } from 'react-hot-loader'
import { AragonApp, observe, SidePanel } from '@aragon/ui'

import { AppContent, AppTitle } from '.'

const ASSETS_URL = 'aragon-ui-assets/'

class App extends React.Component {

  newProject = () => { alert('test new') }
  selectProject = () => { alert('test select') }

  render() {
    return (
      <AragonApp publicUrl={ASSETS_URL}>
        <AppTitle />
        <AppContent projects={this.props.reposManaged} onNewProject={this.newProject} onSelect={this.selectProject} />
      </AragonApp>
    )
  }
}

export default hot(module)(App)
