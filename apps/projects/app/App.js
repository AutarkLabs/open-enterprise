import React from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import { ApolloProvider } from 'react-apollo'

import { useAragonApi } from '@aragon/api-react'
import {
  Main,
  TabBar,
  AppView,
  AppBar,
  NavigationBar,
} from '@aragon/ui'

import { AppTitleButton, AppTitle } from '../../../shared/ui'

import ErrorBoundary from './components/App/ErrorBoundary'
import { Issues, Overview, Settings } from './components/Content'
import PanelManager, { PANELS, PanelContext } from './components/Panel'

import { IdentityProvider } from './components/Shared/IdentityManager'
import {
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_TOKEN_FAILURE,
} from './store/eventTypes'

import useGithubAuth from './hooks/useGithubAuth'
import { getToken, getURLParam, githubPopup, STATUS } from './utils/github'
import { ipfsAdd } from './utils/ipfs-helpers'
import { toHex } from './utils/web3-utils'

const ASSETS_URL = './aragon-ui'

const getTabs = ({ newProject, newIssue, repoCount }) => {
  const tabs = [
    {
      name: 'Overview',
      body: Overview,
      action: <AppTitleButton caption="New Project" onClick={newProject} />,
    },
  ]

  if (repoCount > 0) {
    tabs.push({
      name: 'Issues',
      body: Issues,
      action: <AppTitleButton caption="New Issue" onClick={newIssue} />,
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

  createProject = ({ project }) => {
    this.closePanel()
    this.props.api.addRepo(toHex(project))
  }

  removeProject = project => {
    this.props.api.removeRepo(toHex(project))
    // TODO: Toast feedback here maybe
  }

  newIssue = () => {
    const { repos } = this.props
    const repoNames =
      (repos &&
        repos.map(repo => ({
          name: repo.metadata.name,
          id: repo.data._repo,
        }))) ||
      'No repos'
    const reposIds = (repos && repos.map(repo => repo.data.repo)) || []

    this.setState(() => ({
      panel: PANELS.NewIssue,
      panelProps: {
        reposManaged: repoNames,
        reposIds,
      },
    }))
  }

  // TODO: Review
  // This is breaking RepoList loading sometimes preventing show repos after login
  newProject = () => {
    const reposAlreadyAdded = this.props.repos
      ? this.props.repos.map(repo => repo.data._repo)
      : []

    this.setState((_prevState, { github: { status } }) => ({
      panel: PANELS.NewProject,
      panelProps: {
        onCreateProject: this.createProject,
        reposAlreadyAdded,
      },
    }))
  }

  updateBounty = issues => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.FundIssues,
      panelProps: {
        title: 'Update Funding',
        issues,
        mode: 'update',
      },
    }))
  }

  submitWork = issue => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.SubmitWork,
      panelProps: {
        onSubmitWork: this.onSubmitWork,
        issue,
      },
    }))
  }

  onSubmitWork = async (state, issue) => {
    this.closePanel()
    const hash = await ipfsAdd(state)
    this.props.api.submitWork(toHex(issue.repoId), issue.number, hash)
  }

  reviewApplication = (issue, requestIndex = 0) => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.ReviewApplication,
      panelProps: {
        issue,
        requestIndex,
        onReviewApplication: this.onReviewApplication,
      },
    }))
  }

  onReviewApplication = async (issue, requestIndex, approved, review) => {
    this.closePanel()
    // new IPFS data is old data plus state returned from the panel
    const ipfsData = issue.requestsData[requestIndex]
    const requestIPFSHash = await ipfsAdd({ ...ipfsData, review: review })

    this.props.api.reviewApplication(
      toHex(issue.repoId),
      issue.number,
      issue.requestsData[requestIndex].contributorAddr,
      requestIPFSHash,
      approved
    )
  }

  reviewWork = (issue, index = 0) => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.ReviewWork,
      panelProps: {
        issue,
        index,
        onReviewWork: this.onReviewWork,
      },
    }))
  }

  onReviewWork = async (state, issue) => {
    // new IPFS data is old data plus state returned from the panel
    const ipfsData = issue.workSubmissions[issue.workSubmissions.length - 1]
    const requestIPFSHash = await ipfsAdd({ ...ipfsData, review: state })

    this.closePanel()
    this.props.api.reviewSubmission(
      toHex(issue.repoId),
      issue.number,
      issue.workSubmissions.length - 1,
      state.accepted,
      requestIPFSHash
    )
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
    const {
      activeIndex,
      issueDetail,
      panel,
      panelProps,
    } = this.state
    const { bountySettings, displayMenuButton = false } = this.props

    const status = this.props.github ? this.props.github.status : STATUS.INITIAL

    const tabs = getTabs({
      newProject: this.newProject,
      newIssue: this.newIssue,
      repoCount: this.props.repos && this.props.repos.length,
    })

    const tabNames = tabs.map(t => t.name)
    const TabComponent = tabs[activeIndex.tabIndex].body

    const navigationItems = [
      <AppTitle title="Projects" displayMenuButton={displayMenuButton} />,
      ...(issueDetail ? ['Issue Detail'] : []),
    ]

    return (
      <Main assetsUrl={ASSETS_URL}>
        <ApolloProvider client={this.props.client}>
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
                <PanelContext.Provider value={this.setPanel}>
                  <TabComponent
                    onLogin={this.handleGithubSignIn}
                    status={status}
                    app={this.props.api}
                    bountySettings={bountySettings}
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
                    onNewProject={this.newProject}
                    onRemoveProject={this.removeProject}
                    onNewIssue={this.newIssue}
                    onUpdateBounty={this.updateBounty}
                    onSubmitWork={this.submitWork}
                    activeIndex={activeIndex}
                    changeActiveIndex={this.changeActiveIndex}
                    onReviewApplication={this.reviewApplication}
                    onReviewWork={this.reviewWork}
                    setIssueDetail={this.setIssueDetail}
                    issueDetail={issueDetail}
                  />
                </PanelContext.Provider>
              </ErrorBoundary>
            </AppView>
            <PanelManager
              activePanel={panel}
              onClose={this.closePanel}
              {...panelProps}
            />
          </IdentityProvider>
        </ApolloProvider>
      </Main>
    )
  }
}

export default () => {
  const { api, appState, displayMenuButton } = useAragonApi()
  const { client } = useGithubAuth()
  return (
    <App
      api={api}
      client={client}
      displayMenuButton={displayMenuButton}
      {...appState}
    />
  )
}
