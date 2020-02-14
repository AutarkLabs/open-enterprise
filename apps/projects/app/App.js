import React, { useCallback, useEffect, useState } from 'react'
import { ApolloProvider } from '@apollo/react-hooks'

import { useAragonApi } from './api-react'
import { Main } from '@aragon/ui'

import ErrorBoundary from './components/App/ErrorBoundary'
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
import { BountyIssuesProvider } from './context/BountyIssues'
import Routes from './Routes'

let popupRef = null

const App = () => {
  const { api, appState, guiStyle } = useAragonApi()
  const { appearance } = guiStyle
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
      <Main theme={appearance}>
        <EmptyWrapper>
          <LoadingAnimation />
        </EmptyWrapper>
      </Main>
    )
  } else if (github.status === STATUS.INITIAL) {
    return (
      <Main role="main" theme={appearance}>
        <Unauthorized onLogin={handleGithubSignIn} isSyncing={isSyncing} />
      </Main>
    )
  } else if (github.status === STATUS.FAILED) {
    return (
      <Main theme={appearance}>
        <Error action={noop} />
      </Main>
    )
  }

  return (
    <Main theme={appearance}>
      <ApolloProvider client={client}>
        <PanelContext.Provider value={configurePanel}>
          <IdentityProvider
            onResolve={handleResolveLocalIdentity}
            onShowLocalIdentityModal={handleShowLocalIdentityModal}
          >
            <DecoratedReposProvider>
              <BountyIssuesProvider>
                <main>
                  <ErrorBoundary>
                    <Routes handleGithubSignIn={handleGithubSignIn} />
                  </ErrorBoundary>
                </main>
              </BountyIssuesProvider>
              <PanelManager
                activePanel={panel}
                onClose={closePanel}
                handleGithubSignIn={handleGithubSignIn}
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
