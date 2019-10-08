import React, { useEffect, useState } from 'react'
import { ApolloProvider } from 'react-apollo'

import { useAragonApi, usePath } from './api-react'
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

import { initApolloClient } from './utils/apollo-client'
import { STATUS } from './utils/github'
import Unauthorized from './components/Content/Unauthorized'
import { Error } from './components/Card'
import { DecoratedReposProvider } from './context/DecoratedRepos'
import usePathSegments from './hooks/usePathSegments'
import GithubSignin from './GithubSignin'

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

  const client = github.token ? initApolloClient(github.token) : null

  useEffect(() => {
    setSelectedIssue(selectedIssueId)
  }, [selectedIssueId])

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
      <GithubSignin setGithubLoading={setGithubLoading} />
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
  const currentTab = tabs.find(t => t.name.toLowerCase() === selectedTab) || {}
  const { body: tabBody = null, name: tabName = null } = currentTab
  const TabComponent = tabBody
  const TabAction = () => {
    const { setupNewIssue, setupNewProject } = usePanelManagement()

    switch (tabName) {
    case 'Overview': return (
      <Button mode="strong" icon={<IconPlus />} onClick={setupNewProject} label="New project" />
    )
    case 'Issues': return (
      <Button mode="strong" icon={<IconPlus />} onClick={setupNewIssue} label="New issue" />
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
