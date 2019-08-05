import React from 'react'
import PropTypes from 'prop-types'
import { ApolloProvider } from 'react-apollo'

import { useAragonApi } from '@aragon/api-react'
import { Main, TabBar, AppView, AppBar, NavigationBar } from '@aragon/ui'

import { AppTitle } from '../../../shared/ui'

import {
  ErrorBoundary,
  NewIssueButton,
  NewProjectButton,
} from './components/App'
import { Issues, Overview, Settings } from './components/Content'
import { PanelManager, PanelContext } from './components/Panel'

import { IdentityProvider } from '../../../shared/identity'
import {
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_TOKEN_FAILURE,
} from './store/eventTypes'

import { initApolloClient } from './utils/apollo-client'
import { getToken, getURLParam, githubPopup, STATUS } from './utils/github'

const ASSETS_URL = './aragon-ui'

const getTabs = ({ repoCount }) => {
  const tabs = [
    {
      name: 'Overview',
      body: Overview,
      action: <NewProjectButton />,
    },
  ]

  if (repoCount > 0) {
    tabs.push({
      name: 'Issues',
      body: Issues,
      action: <NewIssueButton />,
    })
  }

  tabs.push({
    name: 'Settings',
    body: Settings,
  })

  return tabs
}

class App extends React.PureComponent {
  static propTypes = {
    api: PropTypes.object, // is not required, since it comes async
    repos: PropTypes.arrayOf(PropTypes.object),
    bountySettings: PropTypes.object,
    displayMenuButton: PropTypes.bool,
    client: PropTypes.object,
    issues: PropTypes.array,
    tokens: PropTypes.array,
    github: PropTypes.shape({
      status: PropTypes.oneOf([
        STATUS.AUTHENTICATED,
        STATUS.FAILED,
        STATUS.INITIAL,
      ]).isRequired,
      token: PropTypes.string,
      event: PropTypes.string,
    }),
  }

  constructor(props) {
    super(props)
    this.state = {
      repos: [],
      activeIndex: { tabIndex: 0, tabData: {} },
      githubLoading: false,
      issueDetail: false,
      panel: null,
      panelProps: null,
    }
  }

  componentDidMount() {
    /**
     * Acting as the redirect target it looks up for 'code' URL param on component mount
     * if it detects the code then sends to the opener window
     * via postMessage with 'popup' as origin and close the window (usually a popup)
     */
    const code = getURLParam('code')
    code &&
      window.opener.postMessage(
        { from: 'popup', name: 'code', value: code },
        '*'
      )
    window.close()
  }

  handlePopupMessage = async message => {
    if (message.data.from !== 'popup') return
    if (message.data.name === 'code') {
      // TODO: Optimize the listeners lifecycle, ie: remove on unmount
      window.removeEventListener('message', this.messageHandler)

      const code = message.data.value
      try {
        const token = await getToken(code)
        this.setState(
          {
            githubLoading: false,
          },
          () => {
            this.props.api.cache('github', {
              event: REQUESTED_GITHUB_TOKEN_SUCCESS,
              status: STATUS.AUTHENTICATED,
              token,
            })
          }
        )
      } catch (err) {
        this.setState(
          {
            githubLoading: false,
          },
          () => {
            this.props.api.cache('github', {
              event: REQUESTED_GITHUB_TOKEN_FAILURE,
              status: STATUS.FAILED,
              token: null,
            })
          }
        )
      }
    }
  }

  handleMenuPanelOpen = () => {
    window.parent.postMessage(
      { from: 'app', name: 'menuPanel', value: true },
      '*'
    )
  }

  changeActiveIndex = activeIndex => {
    this.setState({ activeIndex })
  }

  closePanel = () => {
    this.setState({ panel: null, panelProps: null })
  }

  setPanel = {
    setActivePanel: p => this.setState({ panel: p }),
    setPanelProps: p => this.setState({ panelProps: p }),
  }

  handleGithubSignIn = () => {
    // The popup is launched, its ref is checked and saved in the state in one step
    this.setState(({ oldPopup }) => ({
      popup: githubPopup(oldPopup),
      githubLoading: true,
    }))
    // Listen for the github redirection with the auth-code encoded as url param
    window.addEventListener('message', this.handlePopupMessage)
  }

  handleSelect = index => {
    this.changeActiveIndex({ tabIndex: index, tabData: {} })
  }

  setIssueDetail = visible => {
    this.setState({ issueDetail: visible })
  }

  handleResolveLocalIdentity = address => {
    return this.props.api.resolveAddressIdentity(address).toPromise()
  }
  handleShowLocalIdentityModal = address => {
    return this.props.api
      .requestAddressIdentityModification(address)
      .toPromise()
  }

  render() {
    const { activeIndex, issueDetail, panel, panelProps } = this.state
    const { bountySettings, displayMenuButton = false } = this.props

    const status = this.props.github ? this.props.github.status : STATUS.INITIAL

    const tabs = getTabs({
      repoCount: this.props.repos && this.props.repos.length,
    })

    const tabNames = tabs.map(t => t.name)
    const TabComponent = tabs[activeIndex.tabIndex].body

    const navigationItems = [
      <AppTitle
        key="title"
        title="Projects"
        displayMenuButton={displayMenuButton}
      />,
      ...(issueDetail ? ['Issue Detail'] : []),
    ]

    return (
      <Main assetsUrl={ASSETS_URL}>
        <ApolloProvider client={this.props.client}>
          <PanelContext.Provider value={this.setPanel}>
            <IdentityProvider
              onResolve={this.handleResolveLocalIdentity}
              onShowLocalIdentityModal={this.handleShowLocalIdentityModal}
            >
              <AppView
                style={{ height: '100%', overflowY: 'hidden' }}
                appBar={
                  <AppBar
                    endContent={
                      status === STATUS.AUTHENTICATED &&
                      tabs[activeIndex.tabIndex].action
                    }
                    tabs={
                      issueDetail ? null : (
                        <TabBar
                          items={tabNames}
                          onChange={this.handleSelect}
                          selected={activeIndex.tabIndex}
                        />
                      )
                    }
                  >
                    <NavigationBar
                      items={navigationItems}
                      onBack={() => this.setIssueDetail(false)}
                    />
                  </AppBar>
                }
              >
                <ErrorBoundary>
                  <TabComponent
                    onLogin={this.handleGithubSignIn}
                    status={status}
                    app={this.props.api}
                    githubLoading={this.state.githubLoading}
                    projects={
                      this.props.repos !== undefined ? this.props.repos : []
                    }
                    bountyIssues={
                      this.props.issues !== undefined ? this.props.issues : []
                    }
                    bountySettings={
                      bountySettings !== undefined ? bountySettings : {}
                    }
                    tokens={
                      this.props.tokens !== undefined ? this.props.tokens : []
                    }
                    activeIndex={activeIndex}
                    changeActiveIndex={this.changeActiveIndex}
                    setIssueDetail={this.setIssueDetail}
                    issueDetail={issueDetail}
                  />
                </ErrorBoundary>
              </AppView>
              <PanelManager
                activePanel={panel}
                onClose={this.closePanel}
                {...panelProps}
              />
            </IdentityProvider>
          </PanelContext.Provider>
        </ApolloProvider>
      </Main>
    )
  }
}

const AppWrap = () => {
  const { api, appState, displayMenuButton } = useAragonApi()
  const client = initApolloClient(appState.github && appState.github.token)
  return (
    <App
      api={api}
      client={client}
      displayMenuButton={displayMenuButton}
      {...appState}
    />
  )
}

export default AppWrap
