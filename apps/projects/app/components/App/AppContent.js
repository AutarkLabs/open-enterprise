import PropTypes from 'prop-types'
import React from 'react'
import { TabBar, theme } from '@aragon/ui'

import { STATUS } from '../../utils/github'
import { TabbedView, TabContent } from '../TabbedView'
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

const AppContent = ({
  activeIndex,
  changeActiveIndex,
  onNewIssue,
  onNewProject,
  projects,
  status,
  ...otherProps
}) => {
  const contentData = [
    {
      tabName: 'Overview',
      TabComponent: Overview,
      tabButton: {
        caption: 'New Project',
        onClick: onNewProject,
        disabled: () => false,
        hidden: () => false,
      },
    },
    {
      tabName: 'Issues',
      TabComponent: Issues,
      tabButton: {
        caption: 'New Issue',
        onClick: onNewIssue,
        // TODO: check this, not very readable, and why do we need two variables doing exactly the same?
        disabled: () => (projects.length ? false : true),
        hidden: () => (projects.length ? false : true),
      },
    },
    {
      tabName: 'Settings',
      TabComponent: Settings,
    },
  ]

  const appTitleButton =
    status === STATUS.AUTHENTICATED &&
    contentData[activeIndex.tabIndex].tabButton
      ? contentData[activeIndex.tabIndex].tabButton
      : null

  const handleSelect = index =>
    changeActiveIndex({ tabIndex: index, tabData: {} })
  const tabNames = contentData.map(t => t.tabName)
  const contentProps = {
    activeIndex,
    changeActiveIndex,
    onNewProject,
    projects,
    status,
    ...otherProps,
  }

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
        activeIndex={activeIndex}
        changeActiveIndex={changeActiveIndex}
      >
        <Wrap>
          <TabBar
            items={tabNames}
            onSelect={handleSelect}
            selected={activeIndex.tabIndex}
          />
        </Wrap>
        <TabContent>
          {contentData.map(({ TabComponent }, i) => (
            <TabComponent key={i} {...contentProps} />
          ))}
        </TabContent>
      </TabbedView>
    </React.Fragment>
  )
}

const Wrap = ({ children }) => (
  <div
    style={{
      backgroundColor: theme.contentBackground,
    }}
  >
    {children}
  </div>
)

AppContent.propTypes = {
  activeIndex: PropTypes.shape({
    tabIndex: PropTypes.number,
    tabData: PropTypes.object,
  }).isRequired,
  changeActiveIndex: PropTypes.func.isRequired,
  onNewIssue: PropTypes.func.isRequired,
  onNewProject: PropTypes.func.isRequired,
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
  bountyIssues: PropTypes.arrayOf(PropTypes.object).isRequired,
  status: PropTypes.string.isRequired,
}

export default AppContent
