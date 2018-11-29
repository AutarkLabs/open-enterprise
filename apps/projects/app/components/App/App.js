import { AragonApp, observe, SidePanel } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'

import { ApolloProvider } from 'react-apollo'

import { AppContent } from '.'
import { Title } from '../Shared'
import { NewProject } from '../Panel'
import { STATUS } from '../../utils/github'

const ASSETS_URL = 'aragon-ui-assets/'

// TODO: let the user customize the github app on settings screen?
const CLIENT_ID = 'd556542aa7a03e640409'
const GITHUB_URI = 'https://github.com/login/oauth/authorize'
const AUTH_URI = 'https://tps-github-auth.now.sh/authenticate'

// TODO: This should be dynamically set depending on the execution environment (dev, prod...)
const REDIRECT_URI = 'http://localhost:3333'

export const githubPopup = (popup = null) => {
  // Checks to save some memory if the popup exists as a window object
  if (popup === null || popup.closed) {
    popup = window.open(
      // TODO: Improve readability here: encode = (params: Object) => (JSON.stringify(params).replace(':', '=').trim())
      // encode uurl params
      `${GITHUB_URI}?client_id=${CLIENT_ID}&scope=user&redirect_uri=${REDIRECT_URI}`,
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

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    repos: PropTypes.arrayOf(PropTypes.object),
  }

  state = {
    repos: [],
    activeIndex: 0,
    panel: {
      visible: false,
    },
    // TODO: Don't use this in production
    // reposManaged: projectsMockData(),
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
      const token = await getToken(code)
      console.log('token obtained:', token)
      this.props.app.cache('github', {
        status: STATUS.AUTHENTICATED,
        token: token,
      })
    }
  }

  changeActiveIndex = activeIndex => {
    this.setState({ activeIndex })
  }

  selectProject = () => {
    console.log('selectProject')
  }

  createProject = () => {
    console.info('App.js: createProject')
    this.closePanel()
    this.setState({})
    console.log('projects props:', this.props)
    // console.log('hex:', window.web3.toHex('MDEyOk9yZ2FuaXphdGlvbjM0MDE4MzU5'))

    // this.props.app.addRepo(this.props.userAccount, '0x012026678901')
    this.props.app.addRepo(
      web3.toHex('MDQ6VXNlcjUwMzAwNTk='),
      web3.toHex('MDEwOlJlcG9zaXRvcnkxNDkxMzQ4NTk=')
    )
  }

  newIssue = () => {
    console.log('newIssue')
  }

  newProject = () => {
    console.log('newproject', this.props)

    this.setState({
      panel: {
        visible: true,
        content: NewProject,
        data: {
          heading: 'New Project',
          onCreateProject: this.createProject,
          onGithubSignIn: this.handleGithubSignIn,
        },
      },
    })
  }

  closePanel = () => {
    this.setState({ panel: { visible: false } })
  }

  handleGithubSignIn = () => {
    // The popup is launched, its ref is checked and saved in the state in one step
    this.setState(({ oldPopup }) => ({ popup: githubPopup(oldPopup) }))
    // Listen for the github redirection with the auth-code encoded as url param
    console.log('adding messageListener')
    window.addEventListener('message', this.handlePopupMessage)
  }

  render() {
    const { panel } = this.state
    const { github, client } = this.props
    const PanelContent = panel.content
    console.log('rendered App component, github prop:', github)

    return (
      <StyledAragonApp publicUrl={ASSETS_URL}>
        <Title text="Projects" shadow />
        <ApolloProvider client={client}>
          <AppContent
            app={this.props.app}
            projects={this.props.repos !== undefined ? this.props.repos : []}
            onNewProject={this.newProject}
            onNewIssue={this.newIssue}
            onSelect={this.selectProject}
            activeIndex={this.state.activeIndex}
            changeActiveIndex={this.changeActiveIndex}
          />

          <SidePanel
            title={(panel.data && panel.data.heading) || ''}
            opened={panel.visible}
            onClose={this.closePanel}
          >
            {panel.content && <PanelContent {...panel.data} github={github} />}
          </SidePanel>
        </ApolloProvider>
      </StyledAragonApp>
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
