import { BaseStyles, PublicUrl, observe } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'

import { ApolloProvider } from 'react-apollo'

import { AppContent } from '.'
import { Title } from '../Shared'
import PanelManager, { PANELS } from '../Panel'
import { STATUS } from '../../utils/github'
import ErrorBoundary from './ErrorBoundary'

const ASSETS_URL = './aragon-ui-assets/'

const GITHUB_URI = 'https://github.com/login/oauth/authorize'

let ipfsClient = require('ipfs-http-client')

// TODO: let the user customize the github app on settings screen?
// TODO: Extract to an external js utility to keep this file clean
// Variable fields depending on the execution environment:
// TODO: This should be dynamically set depending on the execution environment (dev, prod...)
let CLIENT_ID = ''
let REDIRECT_URI = ''
let AUTH_URI = ''

let ipfs = ipfsClient({ host: 'localhost', port: '5001', protocol: 'http'})

switch (window.location.origin) {
case 'http://localhost:3333':
  console.log('Github OAuth: Using local http provider deployment')
  CLIENT_ID = 'd556542aa7a03e640409'
  REDIRECT_URI = 'http://localhost:3333'
  AUTH_URI = 'https://tps-github-auth.now.sh/authenticate'
  // TODO: change auth service to be more explicit to:
  // AUTH_URI = 'https://dev-tps-github-auth.now.sh/authenticate'
  break
case 'http://localhost:8080':
  console.log('Github OAuth: Using local IPFS deployment')
  CLIENT_ID = '686f96197cc9bb07a43d'
  REDIRECT_URI = window.location.href
  AUTH_URI = 'https://local-tps-github-auth.now.sh/authenticate'
  break
default:
  console.log(
    'Github OAuth: Scenario not implemented yet, Github API disabled for the current Projects App deployment'
  )
  break
}

export const githubPopup = (popup = null) => {
  // Checks to save some memory if the popup exists as a window object
  if (popup === null || popup.closed) {
    popup = window.open(
      // TODO: Improve readability here: encode = (params: Object) => (JSON.stringify(params).replace(':', '=').trim())
      // encode uurl params
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

/**
 * Sends an http request to the AUTH_URI with the auth code obtained from the oauth flow
 * @param {string} code
 * @returns {string} The authentation token obtained from the auth server
 */
const getToken = async code => {
  console.log('getToken entered')

  // TODO: Manage when server does not respond
  try {
    let response = await fetch(`${AUTH_URI}/${code}`)
    let json = await response.json()
    if (json.token) return json.token
    else throw Error(`${json.error}`)
  } catch (e) {
    console.error('Error from Authentication server:', e)
  }
}

class App extends React.PureComponent {
  static propTypes = {
    app: PropTypes.object.isRequired,
    repos: PropTypes.arrayOf(PropTypes.object),
  }

  state = {
    repos: [],
    activeIndex: { tabIndex: 0, tabData: {}},
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
      console.log('removing messageListener')
      window.removeEventListener('message', this.messageHandler)

      const code = message.data.value
      console.log('AuthCode received from github:', code)
      console.log('Proceeding to token request...')
      // TODO: Check token received correctly
      const token = await getToken(code)
      console.log('token obtained:', token)
      this.props.app.cache('github', {
        status: STATUS.AUTHENTICATED,
        token: token,
      })
      this.setState({
        panelProps: {
          onCreateProject: this.createProject,
          status: STATUS.AUTHENTICATED,
        },
      })
    }
  }

  changeActiveIndex = activeIndex => {
    this.setState({ activeIndex })
  }

  createProject = ({ owner, project }) => {
    console.info('App.js: createProject', project, owner)
    this.closePanel()
    this.props.app.addRepo(web3.toHex(project), web3.toHex(owner))
  }

  removeProject = projectId => {
    console.log('App.js: removeProject', projectId)
    this.props.app.removeRepo(projectId)
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
    this.setState((_prevState, { github: { status } }) => ({
      panel: PANELS.NewProject,
      panelProps: {
        onCreateProject: this.createProject,
        onGithubSignIn: this.handleGithubSignIn,
        status: status,
      },
    }))
  }

  newBountyAllocation = issues => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.NewBountyAllocation,
      panelProps: {
        issues: issues,
        onSubmit: this.onSubmitBountyAllocation,
        bountySettings: this.props.bountySettings,
      },
    }))
  }

  onSubmitBountyAllocation = async issues => {
    this.closePanel()
    let bountySymbol = this.props.bountySettings.bountyCurrency
    let bountyToken
    this.props.tokens.forEach(
      token => {
        if(token.symbol === bountySymbol) {
          bountyToken = token.addr
        }
      }
    )
    
    let issuesArray = []

    for (var key in issues) {
      issuesArray.push({key: key, ...issues[key]})
    }

    console.log('Submit issues:', issuesArray)

    let ipfsString
    ipfsString = await this.getIpfsString(issuesArray)
    
    const tokenArray = new Array(issuesArray.length).fill(bountyToken)

    console.log('Bounty data',
      issuesArray.map( (issue) => issue.repoId),
      issuesArray.map( (issue) => issue.number),
      issuesArray.map( (issue) => issue.size),
      issuesArray.map( (issue) => issue.deadline),
      new Array(issuesArray.length).fill(true),
      tokenArray,
      ipfsString
    )
    this.props.app.addBounties(
      issuesArray.map( (issue) => web3.toHex(issue.repoId)),
      issuesArray.map( (issue) => issue.number),
      issuesArray.map( (issue) => issue.size),
      issuesArray.map( (issue) => {return ( Date.now() + 8600 )} ),
      new Array(issuesArray.length).fill(true),
      tokenArray,
      ipfsString
    )

  }

  getIpfsString = async (issues) => {
    let ipfsString = ''
    let content, results
    for(const issue of issues) {
      content = ipfs.types.Buffer.from(JSON.stringify(issue))
      results = await ipfs.add(content)
      ipfsString = ipfsString.concat(results[0].hash)
    }
    return ipfsString
  }

  submitWork = issue => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.SubmitWork,
      panelProps: {
        onSubmit: this.onSubmitWork,
        githubCurrentUser: this.props.githubCurrentUser,
        issue
      },
    }))
  }

  requestAssignment = issue => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.RequestAssignment,
      panelProps: {
        onRequestAssignment: this.onRequestAssignment,
        githubCurrentUser: this.props.githubCurrentUser,
        issue
      },
    }))
  }

  onRequestAssignment = async (state, issue) => {
    this.closePanel()
    let content = ipfs.types.Buffer.from(JSON.stringify(state))
    let results = await ipfs.add(content)
    let requestString = results[0].hash
    this.props.app.requestAssignment(web3.toHex(issue.repoId), issue.number, requestString)
  }

  reviewApplication = issue => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.ReviewApplication,
      panelProps: {
        issue,
        onReviewApplication: this.onReviewApplication,
      },
    }))
  }

  onReviewApplication = issue => {
    console.log('onReviewApplication Issue:', issue)
    console.log('onReviewApplication submission:', web3.toHex(issue.repoId), issue.number, issue.requestsData[0].contributorAddr)

    this.props.app.approveAssignment(web3.toHex(issue.repoId), issue.number, issue.requestsData[0].contributorAddr)
  }
 
  curateIssues = issues => {
    this.setState((_prevState, _prevProps) => ({
      panel: PANELS.NewIssueCuration,
      panelProps: {
        issues: issues,
        onSubmit: this.onSubmitCuration,
        // rate: getSetting(SETTINGS.rate),
      },
    }))
  }

  onSubmitCuration = issues => {
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
     issues.map(issue => web3.utils.hextToNum(web3.toHex(issue.repoId))) */
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
      emptyIntArray,
      issueNumbers,
      1
    )
  }

  closePanel = () => {
    this.setState({ panel: undefined, panelProps: undefined })
  }

  handleGithubSignIn = () => {
    // The popup is launched, its ref is checked and saved in the state in one step
    this.setState(({ oldPopup }) => ({ popup: githubPopup(oldPopup) }))
    // Listen for the github redirection with the auth-code encoded as url param
    console.log('adding messageListener')
    window.addEventListener('message', this.handlePopupMessage)
  }

  render() {
    const { activeIndex, panel, panelProps } = this.state
    const { client, bountySettings, githubCurrentUser } = this.props

    return (
      <StyledAragonApp publicUrl={ASSETS_URL}>
        <BaseStyles />
        <Title text="Projects" />
        <ApolloProvider client={client}>
          <ErrorBoundary>
            <AppContent
              app={this.props.app}
              bountySettings={bountySettings}
              githubCurrentUser={githubCurrentUser}
              projects={this.props.repos !== undefined ? this.props.repos : []}
              bountyIssues={this.props.issues !== undefined ? this.props.issues : []}
              bountySettings={
                bountySettings !== undefined ? bountySettings : {}
              }
              tokens={this.props.tokens !== undefined ? this.props.tokens : {} }
              onNewProject={this.newProject}
              onRemoveProject={this.removeProject}
              onNewIssue={this.newIssue}
              onCurateIssues={this.curateIssues}
              onAllocateBounties={this.newBountyAllocation}
              onSubmitWork={this.submitWork}
              onRequestAssignment={this.requestAssignment}
              activeIndex={activeIndex}
              changeActiveIndex={this.changeActiveIndex}
              onReviewApplication={this.reviewApplication}
            />

            <PanelManager
              onClose={this.closePanel}
              activePanel={panel}
              {...panelProps}
            />
          </ErrorBoundary>
        </ApolloProvider>
      </StyledAragonApp>
    )
  }
}

const StyledAragonApp = styled(PublicUrl.Provider).attrs({
  url: ASSETS_URL,
})`
  display: flex;
  height: 100vh;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
`

export default observe(
  observable => observable.map(state => ({ ...state })),
  {}
)(hot(module)(App))
