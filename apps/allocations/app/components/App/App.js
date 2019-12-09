import React from 'react'
import { Route } from 'react-router-dom'
import { useAragonApi } from '../../api-react'
import { Main, SidePanel, SyncIndicator } from '@aragon/ui'

import { IdentityProvider } from '../LocalIdentityBadge/IdentityManager'
import { BudgetDetail, Overview } from '.'
import { usePanel } from '../../context/Panel'

const App = () => {
  const { api, appState } = useAragonApi()
  const { isSyncing = true } = appState

  const { panel, panelOpen, setPanel } = usePanel()

  // TODO: Fix this
  // eslint-disable-next-line
  const onExecutePayout = (accountId, payoutId) => {
    api.runPayout(accountId, payoutId).toPromise()
  }

  const handleResolveLocalIdentity = address =>
    api.resolveAddressIdentity(address).toPromise()

  const handleShowLocalIdentityModal = address =>
    api.requestAddressIdentityModification(address).toPromise()

  const PanelContent = panel ? panel.content : null

  return (
    <Main>
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}
      >
        <Route path="/" exact>
          <Overview />
        </Route>
        <Route path="/budgets/:id" exact>
          <BudgetDetail />
        </Route>
        <SyncIndicator visible={isSyncing} />
        <SidePanel
          title={(panel && panel.data.heading) || ''}
          opened={panelOpen}
          onClose={() => setPanel(null)}
        >
          {panel && <PanelContent {...panel.data} />}
        </SidePanel>
      </IdentityProvider>
    </Main>
  )
}

export default App
