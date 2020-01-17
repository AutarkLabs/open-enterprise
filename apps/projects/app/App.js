import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { ApolloProvider } from 'react-apollo'

import { useAragonApi } from './api-react'
import { Main } from '@aragon/ui'

import ErrorBoundary from './components/App/ErrorBoundary'
import { Issues, General, Settings } from './components/Content'
import IssueDetail from './components/Content/IssueDetail'
import { PanelManager, PanelContext } from './components/Panel'

import { IdentityProvider } from '../../../shared/identity'
import {
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_TOKEN_FAILURE,
} from './store/eventTypes'

import { initApolloClient } from './utils/apollo-client'
import { getToken, githubPopup, STATUS } from './utils/github'
import Unauthorized from './components/Content/Unauthorized'
import { LoadingAnimation } from './components/Shared'
import { EmptyWrapper } from './components/Shared'
import { Error } from './components/Card'
import { DecoratedReposProvider } from './context/DecoratedRepos'
import usePathSegments from './hooks/usePathSegments'

let popupRef = null

function Routes({ handleGithubSignIn }) {
  const { selectedIssueId, selectedTab } = usePathSegments()

  if (selectedIssueId) return <IssueDetail issueId={selectedIssueId} />

  if (selectedTab === 'issues') return <Issues />

  if (selectedTab === 'settings') return (
    <Settings onLogin={handleGithubSignIn} />
  )

  return <General />
}

Routes.propTypes = {
  handleGithubSignIn: PropTypes.func.isRequired,
}

const App = () => {
  const { api, appState } = useAragonApi()
  const [ githubLoading, setGithubLoading ] = useState(false)
  const [ panel, setPanel ] = useState(null)
  const [ panelProps, setPanelProps ] = useState(null)

  const {
    github = { status : STATUS.INITIAL },
    isSyncing = true,
  } = appState

  const client = github.token ? initApolloClient(github.token) : null

  const handlePopupMessage = useCallback(message => {
    if (!popupRef) return
    if (message.data.from !== 'popup') return

    popupRef = null

    async function processCode() {
      try {
        const token = await getToken(message.data.value)
        setGithubLoading(false)
        api.emitTrigger(REQUESTED_GITHUB_TOKEN_SUCCESS, {
          status: STATUS.AUTHENTICATED,
          token
        })
      } catch (err) {
        console.error(err)
        setGithubLoading(false)
        api.emitTrigger(REQUESTED_GITHUB_TOKEN_FAILURE, {
          status: STATUS.FAILED,
          token: null,
        })
      }
    }

    processCode()
  }, [api])

  useEffect(() => {
    window.addEventListener('message', handlePopupMessage)
    return () => {
      window.removeEventListener('message', handlePopupMessage)
    }
  }, [handlePopupMessage])

  const closePanel = () => {
    setPanel(null)
    setPanelProps(null)
  }

  const configurePanel = {
    setActivePanel: p => setPanel(p),
    setPanelProps: p => setPanelProps(p),
  }

  const handleGithubSignIn = () => {
    setGithubLoading(true)
    popupRef = githubPopup(popupRef)
  }

  const handleResolveLocalIdentity = address => {
    return api.resolveAddressIdentity(address).toPromise()
  }

  const handleShowLocalIdentityModal = address => {
    return api
      .requestAddressIdentityModification(address)
      .toPromise()
  }

  const noop = () => {}
  if (githubLoading) {
    return (
      <EmptyWrapper>
        <LoadingAnimation />
      </EmptyWrapper>
    )
  } else if (github.status === STATUS.INITIAL) {
    return (
      <Main role="main">
        <Unauthorized onLogin={handleGithubSignIn} isSyncing={isSyncing} />
      </Main>
    )
  } else if (github.status === STATUS.FAILED) {
    return (
      <Main>
        <Error action={noop} />
      </Main>
    )
  }

  return (
    <Main>
      <ApolloProvider client={client}>
        <PanelContext.Provider value={configurePanel}>
          <IdentityProvider
            onResolve={handleResolveLocalIdentity}
            onShowLocalIdentityModal={handleShowLocalIdentityModal}
          >
            <DecoratedReposProvider>
              <main>
                <ErrorBoundary>
                  <Routes handleGithubSignIn={handleGithubSignIn} />
                </ErrorBoundary>
              </main>
              <PanelManager
                activePanel={panel}
                onClose={closePanel}
                {...panelProps}
              />
            </DecoratedReposProvider>
          </IdentityProvider>
        </PanelContext.Provider>
      </ApolloProvider>
    </Main>
  )
}

export default App
