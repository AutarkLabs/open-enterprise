import PropTypes from 'prop-types'
import React from 'react'

import { TabbedView, TabBar, TabContent, Tab } from '../TabbedView'
import { Issues, Overview, Settings } from '../Content'
import AppTitleButton from '../App/AppTitleButton'

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

// TODO: Dynamic component loading

const AppContent = props => {
  const contentData = [
    {
      tabName: 'Overview',
      TabComponent: Overview,
      tabButton: { caption: 'New Project', onClick: props.onNewProject },
    },
    {
      tabName: 'Issues',
      TabComponent: Issues,
      tabButton: { caption: 'New Issue', onClick: props.onNewIssue },
    },
    {
      tabName: 'Settings',
      TabComponent: Settings,
    },
  ]

  var appTitleButton = contentData[props.activeIndex].tabButton
    ? contentData[props.activeIndex].tabButton
    : null

  return (
    <React.Fragment>
      {appTitleButton && (
        <AppTitleButton
          caption={appTitleButton.caption}
          onClick={appTitleButton.onClick}
        />
      )}

      <TabbedView
        activeIndex={props.activeIndex}
        changeActiveIndex={props.changeActiveIndex}
      >
        <TabBar>
          {contentData.map(({ tabName }) => (
            <Tab key={tabName}>{tabName}</Tab>
          ))}
        </TabBar>
        <TabContent>
          {contentData.map(({ TabComponent }, i) => (
            <TabComponent key={i} {...props} />
          ))}
        </TabContent>
      </TabbedView>
    </React.Fragment>
  )
}

AppContent.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
  bountyIssues: PropTypes.arrayOf(PropTypes.object).isRequired,
  tokens: PropTypes.arrayOf(PropTypes.object).isRequired,
  bountySettings: PropTypes.object.isRequired,
  onNewProject: PropTypes.func.isRequired,
  onNewIssue: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  activeIndex: PropTypes.number.isRequired,
  changeActiveIndex: PropTypes.func.isRequired,
}

export default AppContent
