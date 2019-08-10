import React, { useState } from 'react'
import { ASSETS_URL, Header, Main, SidePanel } from '@aragon/ui'
import Decisions from './Decisions'
import { hasLoadedVoteSettings } from './utils/vote-settings'
import { NewPayoutVotePanelContent } from './components/Panels'
import { networkContextType } from '../../../shared/ui'
import { useAragonApi } from '@aragon/api-react'
import { IdentityProvider } from '../../../shared/identity'
import { useNetwork } from '@aragon/api-react'

const App = () => {
  const [ panelVisible,setPanelVisible ] = useState(false)
  const { api, appState = {}, connectedAccount } = useAragonApi()
  const network = useNetwork()

  const {
    votes = [],
    entries = [],
    tokenAddress = '',
    voteTime = 0,
    minParticipationPct = 0,
    pctBase = 0,
  } = appState

  const openPanel = () => {
    setPanelVisible(true)
  }

  const closePanel = () => {
    setPanelVisible(false)
  }

  const handleResolveLocalIdentity = address => {
    return api.resolveAddressIdentity(address).toPromise()
  }

  const handleShowLocalIdentityModal = address => {
    return api
      .requestAddressIdentityModification(address)
      .toPromise()
  }

  return (
    <Main assetsUrl={ASSETS_URL}>
      <Header
        primary="Dot Voting"
      />
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}>

        <Decisions
          onActivate={openPanel}
          app={api}
          votes={votes !== undefined ? votes : []}
          entries={entries !== undefined ? entries : []}
          voteTime={voteTime}
          minParticipationPct={minParticipationPct / 10 ** 16}
          pctBase={pctBase / 10 ** 16}
          tokenAddress={tokenAddress}
          userAccount={connectedAccount}
        />

        <SidePanel
          title={''}
          opened={panelVisible}
          onClose={closePanel}
        >
          <NewPayoutVotePanelContent />
        </SidePanel>
      </IdentityProvider>
    </Main>
  )
}

// eslint-disable-next-line react/display-name
export default App
