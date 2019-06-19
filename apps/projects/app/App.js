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

import { initApolloClient } from './utils/apollo-client'
import { getToken, getURLParam, githubPopup, STATUS } from './utils/github'
import { CURRENT_USER } from './utils/gql-queries'
import { ipfsAdd, computeIpfsString } from './utils/ipfs-helpers'
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
      githubCurrentUser: {},
      client: initApolloClient((props.github && props.github.token) || ''),
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

  componentDidUpdate(prevProps) {
    const hasGithubToken = this.props.github && this.props.github.token
    const hadGithubToken = prevProps.github && prevProps.github.token
    const receivedGithubToken = hasGithubToken && !hadGithubToken
    if (receivedGithubToken) {
      const client = initApolloClient(this.props.github.token)
      client
        .query({
          query: CURRENT_USER,
        })
        .then(({ data }) => {
          this.setState({
            client,
            githubCurrentUser: data.viewer,
          })
        })
    }
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

  newBountyAllocation = issues => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.FundIssues,
      panelProps: {
        issues,
        mode: 'new',
        onSubmit: this.onSubmitBountyAllocation,
        bountySettings: this.props.bountySettings,
        tokens: this.props.tokens !== undefined ? this.props.tokens : [],
        githubCurrentUser: this.state.githubCurrentUser,
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
        onSubmit: this.onSubmitBountyAllocation,
        bountySettings: this.props.bountySettings,
        tokens: this.props.tokens !== undefined ? this.props.tokens : [],
        githubCurrentUser: this.state.githubCurrentUser,
      },
    }))
  }

  onSubmitBountyAllocation = async (issues, description, post, resultData) => {
    this.closePanel()

    // computes an array of issues and denests the actual issue object for smart contract
    const issuesArray = []
    const bountyAddr = this.props.bountySettings.bountyCurrency

    let bountyToken, bountyDecimals, bountySymbol

    this.props.tokens.forEach(token => {
      if (token.addr === bountyAddr) {
        bountyToken = token.addr
        bountyDecimals = token.decimals
        bountySymbol = token.symbol
      }
    })

    for (let key in issues) issuesArray.push({ key: key, ...issues[key] })

    const ipfsString = await computeIpfsString(issuesArray)

    const idArray = issuesArray.map(issue => toHex(issue.repoId))
    const numberArray = issuesArray.map(issue => issue.number)
    const bountyArray = issuesArray.map(issue =>
      BigNumber(issue.size)
        .times(10 ** bountyDecimals)
        .toString()
    )
    const tokenArray = new Array(issuesArray.length).fill(bountyToken)
    const dateArray = new Array(issuesArray.length).fill(Date.now() + 8600)
    const booleanArray = new Array(issuesArray.length).fill(true)

    this.props.api.addBounties(
      idArray,
      numberArray,
      bountyArray,
      dateArray,
      booleanArray,
      tokenArray,
      ipfsString,
      description
    ).subscribe(
      txHash => {
        issuesArray.forEach(issue => {
          post({ variables: {
            body: `This issue has a bounty attached to it.\nAmount: ${issue.size.toFixed(2)} ${bountySymbol}\nDeadline: ${issue.deadline.toUTCString()}`,
            subjectId: issue.key } })
        })
      },
      err => console.log(`error: ${err}`)
    )
  }

  submitWork = issue => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.SubmitWork,
      panelProps: {
        onSubmitWork: this.onSubmitWork,
        githubCurrentUser: this.state.githubCurrentUser,
        issue,
      },
    }))
  }

  onSubmitWork = async (state, issue) => {
    this.closePanel()
    const hash = await ipfsAdd(state)
    this.props.api.submitWork(toHex(issue.repoId), issue.number, hash)
  }

  requestAssignment = issue => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.RequestAssignment,
      panelProps: {
        onRequestAssignment: this.onRequestAssignment,
        githubCurrentUser: this.state.githubCurrentUser,
        issue,
      },
    }))
  }

  onRequestAssignment = async (state, issue) => {
    this.closePanel()
    const hash = await ipfsAdd(state)
    this.props.api.requestAssignment(toHex(issue.repoId), issue.number, hash)
  }

  reviewApplication = (issue, requestIndex = 0) => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.ReviewApplication,
      panelProps: {
        issue,
        requestIndex,
        onReviewApplication: this.onReviewApplication,
        githubCurrentUser: this.state.githubCurrentUser,
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
        githubCurrentUser: this.state.githubCurrentUser,
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

  curateIssues = (selectedIssues, allIssues) => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.NewIssueCuration,
      panelProps: {
        selectedIssues,
        allIssues,
        onSubmit: this.onSubmitCuration,
      },
    }))
  }

  onSubmitCuration = (issues, description) => {
    this.closePanel()
    // TODO: maybe assign this to issueDescriptionIndices, not clear
    let issueDescriptionIndices = []
    issues.forEach((issue, i) => {
      if (i == 0) {
        issueDescriptionIndices.push(issue.title.length)
      } else {
        issueDescriptionIndices.push(issue.title.length)
      }
    })

    // TODO: splitting of descriptions needs to be fixed at smart contract level
    const issueDescriptions = issues.map(issue => issue.title).join('')
    /* TODO: The numbers below are supposedly coming from an eventual:
     issues.map(issue => web3.utils.hexToNum(toHex(issue.repoId))) */
    const issueNumbers = issues.map(issue => issue.number)
    const emptyIntArray = new Array(issues.length).fill(0)
    const emptyAddrArray = [
      '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
      '0xd00cc82a132f421bA6414D196BC830Db95e2e7Dd',
      '0x89c199302bd4ebAfAa0B5Ee1Ca7028C202766A7F',
      '0xd28c35a207c277029ade183b6e910e8d85206c07',
      '0xee6bd04c6164d7f0fa1cb03277c855639d99a7f6',
      '0xb1d048b756f7d432b42041715418b48e414c8f50',
      '0x6945b970fa107663378d242de245a48c079a8bf6',
      '0x83ac654be75487b9cfcc80117cdfb4a4c70b68a1',
      '0x690a63d7023780ccbdeed33ef1ee62c55c47460d',
      '0xb1afc07af31795d61471c169ecc64ad5776fa5a1',
      '0x4aafed050dc1cf7e349accb7c2d768fd029ece62',
      '0xd7a5846dea118aa76f0001011e9dc91a8952bf19',
    ]

    this.props.api.curateIssues(
      emptyAddrArray.slice(0, issues.length),
      emptyIntArray,
      issueDescriptionIndices,
      issueDescriptions,
      description,
      emptyIntArray,
      issueNumbers,
      1
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
      githubCurrentUser,
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
        <ApolloProvider client={this.state.client}>
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
                    githubCurrentUser={githubCurrentUser}
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
                    onCurateIssues={this.curateIssues}
                    onAllocateBounties={this.newBountyAllocation}
                    onUpdateBounty={this.updateBounty}
                    onSubmitWork={this.submitWork}
                    onRequestAssignment={this.requestAssignment}
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
  return <App api={api} displayMenuButton={displayMenuButton} {...appState} />
}
