import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { useAragonApi } from '../../api-react'
import { Button, Header, IconPlus, Main, SidePanel } from '@aragon/ui'

import { IdentityProvider } from '../../../../../shared/identity'
import { ipfsAdd } from '../../../../../shared/utils/ipfs'

import Entities from './Entities'
import NewEntity from '../Panel/NewEntity'
import { Empty } from '../Card'

const ASSETS_URL = './aragon-ui'

const App = () => {
  const [ panelVisible, setPanelVisible ] = useState(false)
  const { api, appState = {} } = useAragonApi()
  
  const { entries = [] } = appState

  const createEntity = async ({ address, name, type }) => {
    closePanel()
    const content = { name, type }
    // add entry data to IPFS
    // TODO: show a nice progress animation here before closing the panel?
    const cId = await ipfsAdd(content)
    api.addEntry(address, cId).toPromise()
  }

  const removeEntity = address => {
    const cid = entries.find(e => e.addr === address).data.cid
    api.removeEntry(address, cid).toPromise()
  }

  // TODO: Implement FE for this
  const updateEntity = async ({ address, name, type }) => {
    closePanel()
    const content = { name, type }
    // add entry data to IPFS
    // TODO: show a nice progress animation here before closing the panel?
    const newCid = await ipfsAdd(content)
    const oldCid = entries.find(e => e.addr === address).data.cid
    api.updateEntry(address, oldCid, newCid).toPromise()
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

  const addressList = entries.map(entry => entry.addr)

  const Wrap = ({ children }) => (
    <Main assetsUrl={ASSETS_URL}>
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}
      >
        { children }
        <SidePanel onClose={closePanel} opened={panelVisible} title="New entity">
          <NewEntity onCreateEntity={createEntity} addressList={addressList} />
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
        primary="Address Book"
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={newEntity} label="New Entity" />
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
