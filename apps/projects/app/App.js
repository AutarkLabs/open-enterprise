import React, { useCallback, useEffect, useState } from 'react'
import { ApolloProvider } from 'react-apollo'

import { useAragonApi, usePath } from './api-react'
import {
  Bar,
  Button,
  BackButton,
  Header,
  IconPlus,
  Main,
  SyncIndicator,
  Tabs,
} from '@aragon/ui'

import ErrorBoundary from './components/App/ErrorBoundary'
import { Bounties, General, Issues, Settings } from './components/Content'
import IssueDetail from './components/Content/IssueDetail'
import { PanelManager, PanelContext, usePanelManagement } from './components/Panel'

import { IdentityProvider } from '../../../shared/identity'
import {
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_TOKEN_FAILURE,
} from './store/eventTypes'

import { initApolloClient } from './utils/apollo-client'
import { getToken, githubPopup, STATUS } from './utils/github'
import { DecoratedReposProvider } from './context/DecoratedRepos'
import usePathSegments from './hooks/usePathSegments'

let popupRef = null

const App = () => {
  const { api, appState } = useAragonApi()
  const [ , requestPath ] = usePath()
  const [ githubLoading, setGithubLoading ] = useState(false)
  const [ panel, setPanel ] = useState(null)
  const [ panelProps, setPanelProps ] = useState(null)

  const {
    repos = [],
    bountySettings = {},
    issues = [],
    tokens = [],
    github = { status : STATUS.INITIAL },
    isSyncing = true,
  } = appState

  const {
    selectedIssueId,
    selectedTab,
    selectIssue: setSelectedIssue,
  } = usePathSegments()

  // TODO: usePathSegments for this
  const selectedProjectId = 0

  const client = initApolloClient(github.token)

  useEffect(() => {
    setSelectedIssue(selectedIssueId)
  }, [selectedIssueId])

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

  const tabs = [
    { name: 'General', body: General },
    { name: 'Bounties', body: Bounties },
    { name: 'Settings', body: Settings },
  ]

  // Determine current tab details
  const currentTab = tabs.find(t => t.name.toLowerCase() === selectedTab) || {}
  const { body: tabBody = null, name: tabName = null } = currentTab
  const TabComponent = tabBody

  const TabAction = () => {
    const { setupNewIssue, setupNewProject } = usePanelManagement()

    switch (tabName) {
    case 'General':
      if (selectedProjectId) return (
        <Button mode="strong" icon={<IconPlus />} onClick={setupNewIssue} label="New issue" />
      )
    // eslint-disable-next-line no-fallthrough
    case 'Bounties':
    case 'Settings':
      return (
        <Button mode="strong" icon={<IconPlus />} onClick={setupNewProject} label="New project" />
      )
    default: return null
    }
  }
  const tabNames = tabs.map(t => t.name)

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
                <Header
                  primary="Projects"
                  secondary={
                    <TabAction />
                  }
                />
                <ErrorBoundary>
                  {isSyncing && <SyncIndicator visible={isSyncing} />}
                  {selectedIssueId ? (
                    <React.Fragment>
                      <Bar>
                        <BackButton onClick={() => setSelectedIssue(null)} />
                      </Bar>
                      <IssueDetail issueId={selectedIssueId} />
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Tabs
                        items={tabNames}
                        onChange={index => {
                          if (index === 0) requestPath('/')
                          else requestPath('/' + tabNames[index].toLowerCase())
                        }}
                        selected={tabs.indexOf(currentTab)}
                      />
                      <TabComponent
                        status={github.status}
                        app={api}
                        bountyIssues={issues}
                        bountySettings={bountySettings}
                        tokens={tokens}
                        setSelectedIssue={setSelectedIssue}
                        onLogin={handleGithubSignIn}
                        isSyncing={isSyncing}
                      />
                    </React.Fragment>
                  )}
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
