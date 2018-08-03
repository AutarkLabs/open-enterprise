import React, { Component } from 'react'
import { hot } from 'react-hot-loader'
import { AragonApp } from '@aragon/ui'
// import { GithubProvider } from './context/GithubContext'

import { Issues, Overview, Settings } from './screens'
import { github } from './utils/github-client'

import TabContent from './components/TabContent'
import TabbedView from './components/TabbedView'
import { Tab } from './components/Tab'
import { TabBar } from './components/TabBar'
import { AppTitle } from './components/AppTitle'
import { runInThisContext } from 'vm'

const tabData = [
  {
    title: 'Overview',
    screen: Overview,
    button: { label: 'Add Project', actions: ['sidePanelOpen'] },
    sidePanelContent: 'NewProject',
    sidePanelTitle: 'New Project',
  },
  {
    title: 'Issues',
    screen: Issues,
    button: { label: 'New Issue', actions: ['createIssue'] },
  },
  { title: 'Settings', screen: Settings },
]

class App extends Component {
  state = { github }

  handleAddRepos = reposToAdd => {
    const { github } = this.state

    Object.keys(reposToAdd).forEach(repoId => {
      var repo = reposToAdd[repoId]
      if (repoId in github.reposManaged) {
        console.log('[App.js] already in: ' + repo.name)
      } else {
        console.log('[App.js] adding: ' + repo.name)
        github.reposManaged[repoId] = repo
      }
    })
  }

  handleCreateProject = () => {
    const { name, description, repoURL, bountySystem } = this.state
    alert(
      'creating: ' +
        name +
        ', ' +
        description +
        ', ' +
        repoURL +
        ', ' +
        bountySystem
    )
  }

  handleGitHubAuth = (authToken, login, avatarUrl) => {
    // probably unnecessarily explicit
    // meant to be called from NewProjectPanelContent after successful whoami query
    const { github } = this.state
    github.authToken = authToken
    github.login = login
    github.avatarUrl = avatarUrl
    github.isAuthenticated = true
    github.activeRepo = ''
    this.setState({ github: github })
  }

  handleRemoveRepo = repoId => {
    this.setState(({ github }) => {
      delete github.reposManaged[repoId]
      return { github: github }
    })
  }

  render() {
    const { github } = this.state
    return (
      // TODO: <React.StrictMode>
      <AragonApp publicUrl="aragon-ui-assets/">
        {/* <GithubProvider> */}
        <AppTitle />
        <TabbedView>
          <TabBar>
            {tabData.map(({ title }) => {
              return <Tab key={title}>{title}</Tab>
            })}
          </TabBar>
          <TabContent>
            {tabData.map(({ screen: Screen }) => (
              <Screen
                key={screen}
                github={github}
                onHandleAddRepos={this.handleAddRepos.bind(this)}
                onHandleGitHubAuth={this.handleGitHubAuth}
                onCreateProject={this.handleCreateProject}
                onRemove={this.handleRemoveRepo}
              />
            ))}
          </TabContent>
        </TabbedView>
        {/* </GithubProvider> */}
      </AragonApp>
      // </React.StrictMode>
    )
  }
}

export default hot(module)(App)
