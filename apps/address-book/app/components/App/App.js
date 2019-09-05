import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { useAragonApi } from '@aragon/api-react'
import { Button, Header, IconPlus, Main, SidePanel } from '@aragon/ui'

import { IdentityProvider } from '../../../../../shared/identity'
import Entities from './Entities'
import NewEntity from '../Panel/NewEntity'
import { Empty } from '../Card'

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

  const Wrap = ({ children }) => (
    <Main assetsUrl={ASSETS_URL}>
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}
      >
        { children }
        <SidePanel onClose={closePanel} opened={panelVisible} title="New contact">
          <NewEntity onCreateEntity={createEntity} />
        </SidePanel>
      </IdentityProvider>
    </Main>
  )

  Wrap.propTypes = {
    children: PropTypes.node.isRequired,
  }

  if (!entries.length) return (
    <Wrap><Empty action={newEntity} /></Wrap>
  )

  return (
    <Wrap>
      <Header
        primary="Contacts"
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={newEntity} label="New contact" />
        }
      />
      <Entities
        entities={entries}
        onNewEntity={newEntity}
        onRemoveEntity={removeEntity}
      />
    </Wrap>
  )
}

export default App
