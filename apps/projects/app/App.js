import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { ApolloProvider } from 'react-apollo'
import styled from 'styled-components'
import { useAragonApi } from './api-react'
import {
  Bar,
  Button,
  BackButton,
  GU,
  Header,
  IconFilter,
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
import { IssueFiltersProvider } from './context/IssueFilters'
import { TextFilter } from './components/Shared/FilterBar/TextFilter'

const noop = () => {}

const tabOptions = [ 'Overview', 'Issues', 'Settings' ]

const tabContents = { Overview, Issues, Settings }

const TabAction = ({ currentTab, showFilters }) => {
  const { setupNewIssue, setupNewProject, filters: filtersPanel } = usePanelManagement()
  switch (currentTab) {
  case 'Settings':
    return null
  case 'Overview':
    return (
      <Button
        icon={<IconPlus />}
        label="New project"
        mode="strong"
        onClick={setupNewProject}
      />
    )
  case 'Issues':
    return (
      <>
        {showFilters && (
          <MiniFilterBar>
            <Button icon={<IconFilter />} onClick={filtersPanel} label="Filters Panel" />
            <TextFilter />
          </MiniFilterBar>
        )}
        <Button mode="strong" icon={<IconPlus />} onClick={setupNewIssue} label="New issue" />
      </>
    )
  }
}

TabAction.propTypes = {
  currentTab: PropTypes.oneOf(tabOptions).isRequired,
  showFilters: PropTypes.bool.isRequired,
}

const App = () => {
  const { api, appState } = useAragonApi()
  const [ activeIndex, setActiveIndex ] = useState(0)
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

  const handlePopupMessage = useCallback(async message => {
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
  }, [api])

  const changeActiveIndex = useCallback(index => setActiveIndex(index), [])

  const closePanel = useCallback(() => {
    setPanel(null)
    setPanelProps(null)
  }, [])

  const configurePanel = useMemo(() => ({
    setActivePanel: p => setPanel(p),
    setPanelProps: p => setPanelProps(p),
  }), [])

  const handleGithubSignIn = useCallback(() => {
    // The popup is launched, its ref is checked and saved in the state in one step
    setGithubLoading(true)

    setPopupRef(githubPopup(popupRef))

    // Listen for the github redirection with the auth-code encoded as url param
    window.addEventListener('message', handlePopupMessage)
  }, [handlePopupMessage])

  const handleResolveLocalIdentity = useCallback(address => {
    return api.resolveAddressIdentity(address).toPromise()
  }, [api])

  const handleShowLocalIdentityModal = useCallback(address => {
    return api
      .requestAddressIdentityModification(address)
      .toPromise()
  }, [api])

  const [ tabNames, setTabNames ] = useState(
    repos.length
      ? tabOptions
      : tabOptions.filter(t => t !== 'Issues')
  )

  useEffect(() => {
    // only mutate tabNames when first repo is added
    if (tabNames.length === 2 && repos.length === 1) {
      setTabNames(tabOptions)
    }
  }, [repos.length])

  const currentTab = tabNames[activeIndex]
  const TabComponent = tabContents[currentTab]

  if (githubLoading) {
    return (
      <EmptyWrapper>
        <LoadingAnimation />
      </EmptyWrapper>
    )
  }

  if (github.status === STATUS.INITIAL) {
    return (
      <Main>
        <Unauthorized onLogin={handleGithubSignIn} isSyncing={isSyncing} />
      </Main>
    )
  }

  if (github.status === STATUS.FAILED) {
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
              <IssueFiltersProvider>
                <Header
                  primary="Projects"
                  secondary={
                    <TabAction
                      currentTab={currentTab}
                      showFilters={!selectedIssueId}
                    />
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
                          onChange={changeActiveIndex}
                          selected={activeIndex}
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
              </IssueFiltersProvider>
            </DecoratedReposProvider>
          </IdentityProvider>
        </PanelContext.Provider>
      </ApolloProvider>
    </Main>
  )
}
const MiniFilterBar = styled.span`
  > * {
    margin-right: ${GU}px;
  }

  @media only screen and (min-width: 515px) {
    display: none;
  }
`

export default App
