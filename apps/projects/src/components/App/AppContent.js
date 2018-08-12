import React from 'react'

import { TabbedView, TabBar, TabContent, Tab } from '../TabbedView'
import { Issues, Overview, Settings } from '../Content'

// TODO: improve structure:
/*
  contentData = [
    {
      title, // merge with screen -> add name to the components
      screen,
      button: { title, actions: [] },
      panel: { content, title },
      empty: { title, text, icon, button: { action, title } }
    }
  ]
*/
const contentData = [
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

const loadTabs = contentData.map(({ title }) => <Tab key={title}>{title}</Tab>)
// TODO: Dynamic component loading
const loadScreens = contentData.map(({ screen: Screen }) => (
  <Screen key={Screen} />
))

const AppContent = () => {
  return (
    <TabbedView>
      <TabBar>{loadTabs}</TabBar>
      <TabContent>{loadScreens}</TabContent>
    </TabbedView>
  )
}

export default AppContent
