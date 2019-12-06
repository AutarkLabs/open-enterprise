import React, { useState } from 'react'
import { useAragonApi } from '../../api-react'
import { Button, Header, IconPlus, Main, SidePanel, SyncIndicator } from '@aragon/ui'

import { IdentityProvider } from '../LocalIdentityBadge/IdentityManager'
import { Empty } from '../Card'
import { NewBudget } from '../Panel'
import { AllocationsHistory, Budgets } from '.'

const App = () => {
  const [ panel, setPanelRaw ] = useState(null)
  const [ panelOpen, setPanelOpen ] = useState(false)
  const { api, appState } = useAragonApi()
  const { allocations = [], budgets = [], isSyncing = true } = appState

  const setPanel = args => {
    if (args) {
      setPanelRaw(args)
      setPanelOpen(true)
    } else {
      setPanelOpen(false)
      setTimeout(() => setPanelRaw(args), 500)
    }
  }

  const saveBudget = ({ amount, name, token }) => {
    api
      .newAccount(
        name,             // _metadata
        token.address,    // _token
        true,             // hasBudget
        amount
      )
      .toPromise()
    setPanel(null)
  }

  // TODO: Fix this
  // eslint-disable-next-line
  const onExecutePayout = (accountId, payoutId) => {
    api.runPayout(accountId, payoutId).toPromise()
  }

  const onNewBudget = () => {
    setPanel({
      content: NewBudget,
      data: { heading: 'New budget', saveBudget },
    })
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
        {budgets.length === 0
          ? <Empty action={onNewBudget} isSyncing={isSyncing} />
          : (
            <React.Fragment>
              <Header
                primary="Allocations"
                secondary={
                  <Button
                    mode="strong"
                    icon={<IconPlus />}
                    onClick={onNewBudget}
                    label="New budget"
                  />
                }
              />
              <Budgets setPanel={setPanel} />
              <SyncIndicator visible={isSyncing} />
            </React.Fragment>
          )
        }
        { !!allocations.length && <AllocationsHistory allocations={allocations} /> }
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
