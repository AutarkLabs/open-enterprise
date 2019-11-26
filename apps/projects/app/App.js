import React, { useEffect, useState } from 'react'
import { ApolloProvider } from 'react-apollo'

import { useAragonApi } from './api-react'
import {
  Bar,
  Button,
  BackButton,
  Header,
  IconPlus,
  Main,
  Tabs,
} from '@aragon/ui'

import ErrorBoundary from './components/App/ErrorBoundary'
import { Issues, Overview, Settings } from './components/Content'
import IssueDetail from './components/Content/IssueDetail'
import { PanelManager, PanelContext, usePanelManagement } from './components/Panel'

import { IdentityProvider } from '../../../shared/identity'
import {
  REQUESTED_GITHUB_TOKEN_SUCCESS,
  REQUESTED_GITHUB_TOKEN_FAILURE,
} from './store/eventTypes'

import { initApolloClient } from './utils/apollo-client'
import { getToken, getURLParam, githubPopup, STATUS } from './utils/github'
import Unauthorized from './components/Content/Unauthorized'
import { LoadingAnimation } from './components/Shared'
import { EmptyWrapper } from './components/Shared'
import { Error } from './components/Card'
import { DecoratedReposProvider } from './context/DecoratedRepos'

const App = () => {
  const { api, appState } = useAragonApi()
  const [ activeIndex, setActiveIndex ] = useState(
    { tabIndex: 0, tabData: {} }
  )
  const [ selectedIssueId, setSelectedIssue ] = useState(null)
  const [ githubLoading, setGithubLoading ] = useState(false)
  const [ panel, setPanel ] = useState(null)
  const [ panelProps, setPanelProps ] = useState(null)
  const [ popupRef, setPopupRef ] = useState(null)

  const {
    repos = [],
    bountySettings = {},
    issues = [],
    tokens = [],
    github = { status : STATUS.INITIAL },
    isSyncing = true,
  } = appState

  const client = github.token ? initApolloClient(github.token) : null

  useEffect(() => {
    const code = getURLParam('code')
    code &&
      window.opener.postMessage(
        { from: 'popup', name: 'code', value: code },
        '*'
      )
    window.close()
  })

  const handlePopupMessage = async message => {
    if (message.data.from !== 'popup') return
    if (message.data.name === 'code') {
      // TODO: Optimize the listeners lifecycle, ie: remove on unmount
      window.removeEventListener('message', handlePopupMessage)

      const code = message.data.value
      try {
        const token = await getToken(code)
        setGithubLoading(false)
        api.emitTrigger(REQUESTED_GITHUB_TOKEN_SUCCESS, {
          status: STATUS.AUTHENTICATED,
          token
        })

      } catch (err) {
        setGithubLoading(false)
        api.emitTrigger(REQUESTED_GITHUB_TOKEN_FAILURE, {
          status: STATUS.FAILED,
          token: null,
        })
      }
    }
  }

  const changeActiveIndex = data => {
    setActiveIndex(data)
  }

  const closePanel = () => {
    setPanel(null)
    setPanelProps(null)
  }

  const configurePanel = {
    setActivePanel: p => setPanel(p),
    setPanelProps: p => setPanelProps(p),
  }

  const handleGithubSignIn = () => {
    // The popup is launched, its ref is checked and saved in the state in one step
    setGithubLoading(true)

    setPopupRef(githubPopup(popupRef))

    // Listen for the github redirection with the auth-code encoded as url param
    window.addEventListener('message', handlePopupMessage)
  }

  const handleSelect = index => {
    changeActiveIndex({ tabIndex: index, tabData: {} })
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
      <Main>
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

  // Tabs are not fixed
  const tabs = [{ name: 'Overview', body: Overview }]
  if (repos.length)
    tabs.push({ name: 'Issues', body: Issues })
  tabs.push({ name: 'Settings', body: Settings })

  // Determine current tab details
  const TabComponent = tabs[activeIndex.tabIndex].body
  const TabAction = () => {
    const { setupNewIssue, setupNewProject } = usePanelManagement()

    switch (tabs[activeIndex.tabIndex].name) {
    case 'Overview': return (
      <Button mode="strong" icon={<IconPlus />} onClick={setupNewProject} label="New project" />
    )
    case 'Issues': return (
      <Button mode="strong" icon={<IconPlus />} onClick={setupNewIssue} label="New issue" />
    )
    default: return null
    }
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
              <Header
                primary="Projects"
                secondary={
                  <TabAction />
                }
              />
              <ErrorBoundary>

                {selectedIssueId
                  ? (
                    <React.Fragment>
                      <Bar>
                        <BackButton onClick={() => setSelectedIssue(null)} />
                      </Bar>
                      <IssueDetail issueId={selectedIssueId} />
                    </React.Fragment>
                  )
                  : (
                    <React.Fragment>
                      <Tabs
                        items={tabs.map(t => t.name)}
                        onChange={handleSelect}
                        selected={activeIndex.tabIndex}
                      />
                      <TabComponent
                        status={github.status}
                        app={api}
                        bountyIssues={issues}
                        bountySettings={bountySettings}
                        tokens={tokens}
                        activeIndex={activeIndex}
                        changeActiveIndex={changeActiveIndex}
                        setSelectedIssue={setSelectedIssue}
                        onLogin={handleGithubSignIn}
                      />
                    </React.Fragment>
                  )
                }
              </ErrorBoundary>
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
