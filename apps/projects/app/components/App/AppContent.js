import PropTypes from 'prop-types'
import React from 'react'

import { STATUS } from '../../utils/github'
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
      tabButton: {
        caption: 'New Project',
        onClick: props.onNewProject,
        disabled: () => false,
        hidden: () => false,
      },
    },
    {
      tabName: 'Issues',
      TabComponent: Issues,
      tabButton: {
        caption: 'New Issue',
        onClick: props.onNewIssue,
        disabled: () => (props.projects.length ? false : true),
        hidden: () => (props.projects.length ? false : true),
      },
    },
    {
      tabName: 'Settings',
      TabComponent: Settings,
    },
  ]

  const appTitleButton =
    props.status === STATUS.AUTHENTICATED &&
    contentData[props.activeIndex.tabIndex].tabButton
      ? contentData[props.activeIndex.tabIndex].tabButton
      : null

  return (
    <React.Fragment>
      {appTitleButton &&
        !appTitleButton.hidden() && (
        <AppTitleButton
          caption={appTitleButton.caption}
          onClick={appTitleButton.onClick}
          disabled={appTitleButton.disabled()}
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
  onUpdateBounty: PropTypes.func.isRequired,
  activeIndex: PropTypes.object.isRequired,
  changeActiveIndex: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
}

export default AppContent
