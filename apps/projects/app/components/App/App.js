import React from 'react'
import { hot } from 'react-hot-loader'
import { AragonApp, observe, SidePanel } from '@aragon/ui'
import PropTypes from 'prop-types'
import { AppContent, AppTitle } from '.'
import { NewProject } from '../Panel'

import projectsMockData from '../../utils/mockData'

const ASSETS_URL = 'aragon-ui-assets/'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }

  state = {
    activeIndex: 0,
    panel: {
      visible: false,
    },
    // TODO: Don't use this in production
    reposManaged: projectsMockData(),
  }

  changeActiveIndex = (activeIndex) => {
    this.setState({ activeIndex })
  }

  selectProject = () => { alert('test select') }

  createProject = ({}) => { alert('create project')}

  newIssue = () => { alert('new issue') }

  newProject = () => {
    this.setState({
      panel: {
        visible: true,
        content: NewProject,
        data: { heading: 'New Project', onCreateProject: this.createProject },
      },
    })
  }

  closePanel = () => {       
    this.setState({ panel: { visible: false } })
  }

  render() {
    const { panel } = this.state
    const PanelContent = panel.content

    return (
      <AragonApp publicUrl={ASSETS_URL}>
        <AppTitle />

        <AppContent
          projects={this.state.reposManaged}
          onNewProject={this.newProject}
          onNewIssue={this.newIssue}
          onSelect={this.selectProject} activeIndex={this.state.activeIndex} changeActiveIndex={this.changeActiveIndex}/>

        <SidePanel
          title={(panel.data && panel.data.heading) || ''}
          opened={panel.visible}
          onClose={this.closePanel}
        >
          {panel.content && <PanelContent {...panel.data} />}
        </SidePanel>

      </AragonApp>
    )
  }
}

export default hot(module)(App)
