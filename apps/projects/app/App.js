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

const getTabs = ({ repoCount }) => {
  const { setupNewIssue, setupNewProject } = usePanelManagement()

  const tabs = [
    {
      name: 'Overview',
      body: Overview,
      action: <Button mode="strong" icon={<IconPlus />} onClick={setupNewProject} label="New Project" />,
    },
  ]

  if (repoCount > 0) {
    tabs.push({
      name: 'Issues',
      body: Issues,
      action: <Button mode="strong" icon={<IconPlus />} onClick={setupNewIssue} label="New Issue" />,
    })
  }

  tabs.push({
    name: 'Settings',
    body: Settings,
  })

  return tabs
}

const App = () => {
  const { api, appState } = useAragonApi()
  const [ activeIndex, setActiveIndex ] = useState(
    { tabIndex: 0, tabData: {} }
  )
  const [ issueDetail, setIssueDetail ] = useState(false)
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
        api.trigger(REQUESTED_GITHUB_TOKEN_SUCCESS, {
          status: STATUS.AUTHENTICATED,
          token
        })

      } catch (err) {
        setGithubLoading(false)
        api.trigger(REQUESTED_GITHUB_TOKEN_FAILURE, {
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
  } else  if (github.status === STATUS.INITIAL) {
    return <Unauthorized onLogin={handleGithubSignIn} />
  } else if (github.status === STATUS.FAILED) {
    return <Error action={noop} />
  }

  const tabs = getTabs({
    repoCount: repos.length,
    //repoCount: 1,
  })

  const tabNames = tabs.map(t => t.name)
  const TabComponent = tabs[activeIndex.tabIndex].body

  return (
    <Main>
      <ApolloProvider client={client}>
        <PanelContext.Provider value={configurePanel}>
          <IdentityProvider
            onResolve={handleResolveLocalIdentity}
            onShowLocalIdentityModal={handleShowLocalIdentityModal}
          >
            <Header
              primary="Projects"
              secondary={
                tabs[activeIndex.tabIndex].action
              }
            />

            {issueDetail ?
              <Bar>
                <BackButton
                  onClick={() => {setIssueDetail(false)}}
                />
              </Bar>
              :
              <Tabs
                items={tabNames}
                onChange={handleSelect}
                selected={activeIndex.tabIndex}
              />
            }

            <ErrorBoundary>
              <TabComponent
                status={github.status}
                app={api}
                projects={repos}
                bountyIssues={issues}
                bountySettings={bountySettings}
                tokens={tokens}
                activeIndex={activeIndex}
                changeActiveIndex={changeActiveIndex}
                setIssueDetail={setIssueDetail}
                issueDetail={issueDetail}
                onLogin={handleGithubSignIn}
              />
            </ErrorBoundary>

            <PanelManager
              activePanel={panel}
              onClose={closePanel}
              {...panelProps}
            />
          </IdentityProvider>
        </PanelContext.Provider>
      </ApolloProvider>
    </Main>
  )
}

export default App
