import { Main, BaseStyles, observe, ToastHub } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'
import { map } from 'rxjs/operators'
import ApolloClient from 'apollo-boost'

import { ApolloProvider } from 'react-apollo'

import { AppContent } from '.'
import { Title } from '../Shared'
import PanelManager, { PANELS } from '../Panel'
import { STATUS } from '../../utils/github'
import ErrorBoundary from './ErrorBoundary'
import BigNumber from 'bignumber.js'
import { ipfsAdd, computeIpfsString } from '../../utils/ipfs-helpers'
import { networkContextType } from '../../../../../shared/ui'
import {
  REQUESTING_GITHUB_TOKEN,
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_TOKEN_FAILURE
} from '../../store/eventTypes'
import { CURRENT_USER } from '../../utils/gql-queries'

const ASSETS_URL = './aragon-ui-assets/'

const GITHUB_URI = 'https://github.com/login/oauth/authorize'

// TODO: let the user customize the github app on settings screen?
// TODO: Extract to an external js utility to keep this file clean
// Variable fields depending on the execution environment:
// TODO: This should be dynamically set depending on the execution environment (dev, prod...)
let CLIENT_ID = ''
let REDIRECT_URI = ''
let AUTH_URI = ''

switch (window.location.origin) {
case 'http://localhost:3333':
  CLIENT_ID = 'd556542aa7a03e640409'
  REDIRECT_URI = 'http://localhost:3333'
  AUTH_URI = 'https://tps-github-auth.now.sh/authenticate'
  // TODO: change auth service to be more explicit to:
  // AUTH_URI = 'https://dev-tps-github-auth.now.sh/authenticate'
  break
case 'http://localhost:8080':
  CLIENT_ID = '686f96197cc9bb07a43d'
  REDIRECT_URI = window.location.href
  AUTH_URI = 'https://local-tps-github-auth.now.sh/authenticate'
  break
default:
  console.log(
    'GitHub OAuth: Scenario not implemented yet, GitHub API disabled for the current Projects App deployment'
  )
  break
}

export const githubPopup = (popup = null) => {
  // Checks to save some memory if the popup exists as a window object
  if (popup === null || popup.closed) {
    popup = window.open(
      // TODO: Improve readability here: encode = (params: Object) => (JSON.stringify(params).replace(':', '=').trim())
      // encode url params
      `${GITHUB_URI}?client_id=${CLIENT_ID}&scope=public_repo&redirect_uri=${REDIRECT_URI}`,
      // `${REDIRECT_URI}/?code=232r3423`, // <= use this to avoid spamming github for testing purposes
      'githubAuth',
      // TODO: Improve readability here: encode = (fields: Object) => (JSON.stringify(fields).replace(':', '=').trim())
      `scrollbars=no,toolbar=no,location=no,titlebar=no,directories=no,status=no,menubar=no, ${getPopupDimensions()}`
    )
  } else popup.focus()
  return popup
}

const getPopupDimensions = () => {
  const { width, height } = getPopupSize()
  const { top, left } = getPopupOffset({ width, height })
  return `width=${width},height=${height},top=${top},left=${left}`
}

const getPopupSize = () => {
  return { width: 650, height: 850 }
}

const getPopupOffset = ({ width, height }) => {
  const wLeft = window.screenLeft ? window.screenLeft : window.screenX
  const wTop = window.screenTop ? window.screenTop : window.screenY

  const left = wLeft + window.innerWidth / 2 - width / 2
  const top = wTop + window.innerHeight / 2 - height / 2

  return { top, left }
}

const getURLParam = param => {
  const searchParam = new URLSearchParams(window.location.search)
  return searchParam.get(param)
}

const initApolloClient = (token) =>
  new ApolloClient({
    uri: 'https://api.github.com/graphql',
    request: operation => {
      if (token) {
        operation.setContext({
          headers: {
            accept: 'application/vnd.github.starfire-preview+json', // needed to create issues
            authorization: `bearer ${token}`,
          },
        })
      }
    }
  })

/**
 * Sends an http request to the AUTH_URI with the auth code obtained from the oauth flow
 * @param {string} code
 * @returns {string} The authentication token obtained from the auth server
 */
const getToken = async code => {
  const response = await fetch(`${AUTH_URI}/${code}`)
  const json = await response.json()
  return json.token
}

class App extends React.PureComponent {
  static propTypes = {
    app: PropTypes.object.isRequired,
    repos: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    network: {},
  }

  static childContextTypes = {
    network: networkContextType,
  }

  constructor(props) {
    super(props)
    this.state = {
      repos: [],
      panelProps: {},
      activeIndex: { tabIndex: 0, tabData: {} },
      githubLoading: false,
      githubCurrentUser: {},
      client: initApolloClient(props.github && props.github.token || '')
    }
  }

  getChildContext() {
    const { network } = this.props
    return {
      network: {
        type: network.type,
      },
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
        this.setState({
          githubLoading: false,
          panelProps: {
            onCreateProject: this.createProject,
            status: STATUS.AUTHENTICATED,
          },
        }, () => {
          this.props.app.cache('github', {
            event: REQUESTED_GITHUB_TOKEN_SUCCESS,
            status: STATUS.AUTHENTICATED,
            token,
          })
        })
      } catch (err) {
        this.setState(
          {
            githubLoading: false,
            panelProps: {
              onCreateProject: this.createProject,
              status: STATUS.FAILED,
            },
          },
          () => {
            this.props.app.cache('github', {
              event: REQUESTED_GITHUB_TOKEN_FAILURE,
              status: STATUS.FAILED,
              token: null,
            })
          })
      }
    }
  }

  handleMenuPanelOpen = () => {
    window.parent.postMessage(
      { from: 'app', name: 'menuPanel', value: true }, '*'
    )
  }

  changeActiveIndex = activeIndex => {
    this.setState({ activeIndex })
  }

  createProject = ({ owner, project }) => {
    this.closePanel()
    this.props.app.addRepo(web3.toHex(project), web3.toHex(owner))
  }

  removeProject = project => {
    this.props.app.removeRepo(web3.toHex(project))
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
        closePanel: this.closePanel,
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
        onGithubSignIn: this.handleGithubSignIn,
        reposAlreadyAdded,
        status: status,
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
        closePanel: this.closePanel,
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
        closePanel: this.cancelBounties,
        tokens: this.props.tokens !== undefined ? this.props.tokens : [],
        githubCurrentUser: this.state.githubCurrentUser,
      },
    }))
  }

  onSubmitBountyAllocation = async (issues, description) => {
    this.closePanel()

    // computes an array of issues and denests the actual issue object for smart contract
    const issuesArray = []
    const bountySymbol = this.props.bountySettings.bountyCurrency

    let bountyToken, bountyDecimals

    this.props.tokens.forEach(token => {
      if (token.symbol === bountySymbol) {
        bountyToken = token.addr
        bountyDecimals = token.decimals
      }
    })

    for (let key in issues) issuesArray.push({ key: key, ...issues[key] })

    const ipfsString = await computeIpfsString(issuesArray)

    const idArray = issuesArray.map(issue => web3.toHex(issue.repoId))
    const numberArray = issuesArray.map(issue => issue.number)
    const bountyArray = issuesArray.map(issue =>
      BigNumber(issue.size)
        .times(10 ** bountyDecimals)
        .toString()
    )
    const tokenArray = new Array(issuesArray.length).fill(bountyToken)
    const dateArray = new Array(issuesArray.length).fill(Date.now() + 8600)
    const booleanArray = new Array(issuesArray.length).fill(true)

    console.log('Submit issues:', issuesArray)
    this.props.app.addBounties(
      idArray,
      numberArray,
      bountyArray,
      dateArray,
      booleanArray,
      tokenArray,
      ipfsString,
      description
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
    this.props.app.submitWork(web3.toHex(issue.repoId), issue.number, hash)
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
    this.props.app.requestAssignment(
      web3.toHex(issue.repoId),
      issue.number,
      hash
    )
  }

  reviewApplication = issue => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.ReviewApplication,
      panelProps: {
        issue,
        onReviewApplication: this.onReviewApplication,
        githubCurrentUser: this.state.githubCurrentUser,
      },
    }))
  }

  onReviewApplication = async (issue, requestIndex, approved, review) => {
    this.closePanel()
    // new IPFS data is old data plus state returned from the panel
    const ipfsData = issue.requestsData[requestIndex]
    ipfsData.review = review

    const requestIPFSHash = await ipfsAdd(ipfsData)

    this.props.app.approveAssignment(
      web3.toHex(issue.repoId),
      issue.number,
      issue.requestsData[requestIndex].contributorAddr,
      requestIPFSHash,
      approved
    )
  }

  reviewWork = issue => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.ReviewWork,
      panelProps: {
        issue,
        onReviewWork: this.onReviewWork,
        githubCurrentUser: this.state.githubCurrentUser,
      },
    }))
  }

  onReviewWork = async (state, issue) => {
    // new IPFS data is old data plus state returned from the panel
    const ipfsData = issue.workSubmissions[issue.workSubmissions.length - 1]
    ipfsData.review = state
    const requestIPFSHash = await ipfsAdd(ipfsData)

    this.closePanel()
    this.props.app.reviewSubmission(
      web3.toHex(issue.repoId),
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
     issues.map(issue => web3.utils.hexToNum(web3.toHex(issue.repoId))) */
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

    this.props.app.curateIssues(
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

  cancelBounties = id => {
    console.log('closing')
    this.closePanel()
  }

  closePanel = () => {
    this.setState({ panel: undefined, panelProps: undefined })
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

  render() {
    const { activeIndex, panel, panelProps, githubCurrentUser } = this.state
    const { bountySettings } = this.props
    return (
      <StyledAragonApp publicUrl={ASSETS_URL}>
        <BaseStyles />
        <ToastHub>
          <Title text="Projects" handleMenuPanelOpen={this.handleMenuPanelOpen} />
          <ApolloProvider client={this.state.client}>
            <ErrorBoundary>
              <AppContent
                onLogin={this.handleGithubSignIn}
                status={(this.props.github && this.props.github.status) || STATUS.INITIAL}
                app={this.props.app}
                bountySettings={bountySettings}
                githubCurrentUser={githubCurrentUser}
                githubLoading={this.state.githubLoading}
                projects={this.props.repos !== undefined ? this.props.repos : []}
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
              />

              <PanelManager
                onClose={this.closePanel}
                activePanel={panel}
                {...panelProps}
              />
            </ErrorBoundary>
          </ApolloProvider>
        </ToastHub>
      </StyledAragonApp>
    )
  }
}

const StyledAragonApp = styled(Main)`
  display: flex;
  height: 100vh;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
`

export default observe(
  observable => observable.pipe(map(state => ({ ...state }))),
  {}
)(hot(module)(App))
