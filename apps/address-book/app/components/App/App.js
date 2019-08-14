import React, { useState } from 'react'
import styled from 'styled-components'

import { useAragonApi } from '@aragon/api-react'
import { AppBar, AppView, Main, SidePanel } from '@aragon/ui'

import { AppTitle, AppTitleButton } from '../../../../../shared/ui'
import { IdentityProvider } from '../../../../../shared/identity'
import Entities from './Entities'
import NewEntity from '../Panel/NewEntity'

const ASSETS_URL = './aragon-ui'

const App = () => {
  const [ panelVisible, setPanelVisible ] = useState(false)
  const { api, appState = {}, displayMenuButton = false } = useAragonApi()

  const { entries = [] } = appState

  const createEntity = ({ address, name, type }) => {
    api.addEntry(address, name, type).toPromise()
    closePanel()
  }

  const removeEntity = address => {
    api.removeEntry(address).toPromise()
  }

  const newEntity = () => {
    setPanelVisible(true)
  }

  const closePanel = () => {
    setPanelVisible(false)
  }

  const handleResolveLocalIdentity = address =>
    api.resolveAddressIdentity(address).toPromise()

  const handleShowLocalIdentityModal = address =>
    api.requestAddressIdentityModification(address).toPromise()

  return (
    <Main assetsUrl={ASSETS_URL}>
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}
      >
        <AppView
          appBar={
            <AppBar
              endContent={
                <AppTitleButton caption="New Entity" onClick={newEntity} />
              }
            >
              <AppTitle
                css="padding-left: 30px"
                displayMenuButton={displayMenuButton}
                title="Address Book"
              />
            </AppBar>
          }
        >
          <ScrollWrapper>
            <Entities
              entities={entries}
              onNewEntity={newEntity}
              onRemoveEntity={removeEntity}
            />
          </ScrollWrapper>
        </AppView>

        <SidePanel onClose={closePanel} opened={panelVisible} title="New entity">
          <NewEntity onCreateEntity={createEntity} />
        </SidePanel>
      </IdentityProvider>
    </Main>
  )
}

const ScrollWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  overflow: auto;
  flex-grow: 1;
`
export default App
