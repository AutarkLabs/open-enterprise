import { AragonApp, observe, SidePanel } from '@aragon/ui'
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

const ASSETS_URL = 'aragon-ui-assets/'

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
      `${GITHUB_URI}?client_id=${CLIENT_ID}&scope=user%20public_repo&redirect_uri=${REDIRECT_URI}`,
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
    activeIndex: 0,
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

  selectProject = () => {
    console.log('selectProject')
  }

  createProject = ({ owner, project }) => {
    console.info('App.js: createProject', project)
    this.closePanel()
    // this.setState({})
    console.log('projects props:', web3.toHex(owner).toString(), web3.toHex(project).toString())
    // console.log('hex:', window.web3.toHex('MDEyOk9yZ2FuaXphdGlvbjM0MDE4MzU5'))

    console.log(this.props.app.addRepo(web3.toHex(owner), web3.toHex(project)))
  }

  newIssue = () => {
    const { repos } = this.props
    const repoNames =
      (repos &&
        repos.map(repo => ({
          name: repo.metadata.name,
          id: repo.data.repo,
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
    var issuesTitles = issues.map(issue => issue.title)
    var issueIndicies = []
    issues.map((issue, i, indicies) => {
      if(i == 0){
        return issues[i].title.length
      }
      return indicies[i-1] + issues[i].title.length
    })
    console.log(
      'Ready to curate these issues from the contract:',
      issuesTitles,
      issues.map(issue => issue.id),
      issues.map(issue => issue.number),
      issues.map(issue => issue.repo)
    )
    console.log(issues)
    console.log('Repos:', this.props.repos)
    const emptyIntArray = new Array(issues.length).fill(0)
    this.props.app.curateIssues(
      emptyIntArray,
      emptyIntArray,
      issueIndicies,
      issuesTitles.join(),
      //issues.map(issue => issue.repo)
      this.state.repos,
      issues.map(issue => issue.number)
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
    const { client } = this.props
    return (
      <ErrorBoundary>
        <StyledAragonApp publicUrl={ASSETS_URL}>
          <Title text="Projects" shadow />
          <ApolloProvider client={client}>
            <AppContent
              app={this.props.app}
              projects={this.props.repos !== undefined ? this.props.repos : []}
              onNewProject={this.newProject}
              onNewIssue={this.newIssue}
              onCurateIssues={this.curateIssues}
              onAllocateBounties={this.newBountyAllocation}
              onSelect={this.selectProject}
              activeIndex={activeIndex}
              changeActiveIndex={this.changeActiveIndex}
            />

            <PanelManager
              onClose={this.closePanel}
              activePanel={panel}
              {...panelProps}
            />
          </ApolloProvider>
        </StyledAragonApp>
      </ErrorBoundary>
    )
  }
}

const StyledAragonApp = styled(AragonApp).attrs({
  publicUrl: ASSETS_URL,
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
