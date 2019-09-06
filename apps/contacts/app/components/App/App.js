import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { useAragonApi } from '@aragon/api-react'
import { Button, Header, IconPlus, Main, SidePanel } from '@aragon/ui'

import { IdentityProvider } from '../../../../../shared/identity'
import Contacts from './Contacts'
import NewContact from '../Panel/NewContact'
import { Empty } from '../Card'

const ASSETS_URL = './aragon-ui'

const App = () => {
  const [ panelVisible, setPanelVisible ] = useState(false)
  const { api, appState = {} } = useAragonApi()

  const { entries = [] } = appState

  const createContact = ({ address, name, type }) => {
    api.addEntry(address, name, type).toPromise()
    closePanel()
  }

  const removeContact = address => {
    api.removeEntry(address).toPromise()
  }

  const newContact = () => {
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
          <NewContact onCreateContact={createContact} />
        </SidePanel>
      </IdentityProvider>
    </Main>
  )

  Wrap.propTypes = {
    children: PropTypes.node.isRequired,
  }

  if (!entries.length) return (
    <Wrap><Empty action={newContact} /></Wrap>
  )

  return (
    <Wrap>
      <Header
        primary="Contacts"
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={newContact} label="New contact" />
        }
      />
      <Contacts
        contacts={entries}
        onNewContact={newContact}
        onRemoveContact={removeContact}
      />
    </Wrap>
  )
}

export default App
