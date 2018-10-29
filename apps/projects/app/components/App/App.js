import { AragonApp, observe, SidePanel } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'

import { AppContent } from '.'
import { Title } from '../Shared'
import { NewProject } from '../Panel'

const ASSETS_URL = 'aragon-ui-assets/'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    repos: PropTypes.arrayOf(PropTypes.object),
  }

  state = {
    repos: [],
    activeIndex: 0,
    panel: {
      visible: false,
    },
    // TODO: Don't use this in production
    // reposManaged: projectsMockData(),
  }

  changeActiveIndex = activeIndex => {
    this.setState({ activeIndex })
  }

  selectProject = () => {
    console.log('selectProject')
  }

  createProject = () => {
    console.info('App.js: createProject')
    this.closePanel()
    this.setState({})
    console.log('projects props:', this.props)
    // console.log('hex:', window.web3.toHex('MDEyOk9yZ2FuaXphdGlvbjM0MDE4MzU5'))

    // this.props.app.addRepo(this.props.userAccount, '0x012026678901')
    this.props.app.addRepo(
      web3.toHex('MDQ6VXNlcjUwMzAwNTk='),
      web3.toHex('MDEwOlJlcG9zaXRvcnkxNDkxMzQ4NTk=')
    )
  }

  newIssue = () => {
    console.log('newIssue')
  }

  newProject = () => {
    console.log('newproject', this.props)

    this.setState({
      panel: {
        visible: true,
        content: NewProject,
        data: {
          heading: 'New Project',
          onCreateProject: this.createProject,
        },
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
      <StyledAragonApp publicUrl={ASSETS_URL}>
        <Title text="Projects" shadow />

        <AppContent
          app={this.props.app}
          projects={this.props.repos !== undefined ? this.props.repos : []}
          onNewProject={this.newProject}
          onNewIssue={this.newIssue}
          onSelect={this.selectProject}
          activeIndex={this.state.activeIndex}
          changeActiveIndex={this.changeActiveIndex}
        />

        <SidePanel
          title={(panel.data && panel.data.heading) || ''}
          opened={panel.visible}
          onClose={this.closePanel}
        >
          {panel.content && <PanelContent {...panel.data} />}
        </SidePanel>
      </StyledAragonApp>
    )
  }
}

const StyledAragonApp = styled(AragonApp).attrs({
  publicUrl: ASSETS_URL,
})`
  display: flex;
  height: 100vh;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
`

export default observe(
  observable => observable.map(state => ({ ...state })),
  {}
)(hot(module)(App))
