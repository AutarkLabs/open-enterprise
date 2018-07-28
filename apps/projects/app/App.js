import React, { Component } from 'react'
import { hot } from 'react-hot-loader'
import { AragonApp } from '@aragon/ui'
// import { GithubProvider } from './context/GithubContext'

import { Issues, Overview, Settings } from './screens'
import { githubData } from './utils/github-client'

import TabContent from './components/TabContent'
import TabbedView from './components/TabbedView'
import { Tab } from './components/Tab'
import { TabBar } from './components/TabBar'
import { AppTitle } from './components/AppTitle'

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
  render() {
    return (
      // TODO: <React.StrictMode>
      <AragonApp backgroundLogo publicUrl="aragon-ui-assets/">
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
              <Screen key={screen} github={githubData} />
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
