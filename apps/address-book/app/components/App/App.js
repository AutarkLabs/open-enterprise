import React, { useState } from 'react'

import { useAragonApi } from '@aragon/api-react'
import { Button, Header, IconPlus, Main, SidePanel } from '@aragon/ui'

import { IdentityProvider } from '../../../../../shared/identity'
import Entities from './Entities'
import NewEntity from '../Panel/NewEntity'

const ASSETS_URL = './aragon-ui'

const App = () => {
  const [ panelVisible, setPanelVisible ] = useState(false)
  const { api, appState = {} } = useAragonApi()

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
      { entries.length > 0 && (
        <Header
          primary="Address Book"
          secondary={
            <Button mode="strong" icon={<IconPlus />} onClick={newEntity} label="New Entity" />
          }
        />
      )}
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}
      >
        <Entities
          entities={entries}
          onNewEntity={newEntity}
          onRemoveEntity={removeEntity}
        />
        <SidePanel onClose={closePanel} opened={panelVisible} title="New entity">
          <NewEntity onCreateEntity={createEntity} />
        </SidePanel>
      </IdentityProvider>
    </Main>
  )
}

export default App
