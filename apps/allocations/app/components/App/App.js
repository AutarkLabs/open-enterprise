import React from 'react'
import { useAragonApi, usePath } from '../../api-react'
import { Main, SidePanel, SyncIndicator } from '@aragon/ui'

import { IdentityProvider } from '../LocalIdentityBadge/IdentityManager'
import { BudgetDetail, Overview } from '.'
import { usePanel } from '../../context/Panel'

const BUDGETS_REGEX = new RegExp('^/budgets/')

function Routes() {
  const [path] = usePath()
  if (path.match(BUDGETS_REGEX)) return <BudgetDetail />
  return <Overview />
}

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
        <Routes />
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
