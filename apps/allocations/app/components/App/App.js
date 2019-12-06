import React, { useState } from 'react'
import { useAragonApi } from '../../api-react'
import { Button, Header, IconPlus, Main, SidePanel, SyncIndicator } from '@aragon/ui'

import { IdentityProvider } from '../LocalIdentityBadge/IdentityManager'
import { Empty } from '../Card'
import { NewAllocation, NewBudget } from '../Panel'
import { AllocationsHistory, Budgets } from '.'
import { Deactivate } from '../Modal'

const App = () => {
  const [ panel, setPanelRaw ] = useState(null)
  const [ panelOpen, setPanelOpen ] = useState(false)
  const [ isModalVisible, setModalVisible ] = useState(false)
  const [ currentBudgetId, setCurrentBudgetId ] = useState('')
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

  const saveBudget = ({ id, amount, name, token }) => {
    if (id) {
      api.setBudget(id, amount, name).toPromise()
    } else {
      api
        .newAccount(
          name,             // _metadata
          token.address,    // _token
          true,             // hasBudget
          amount
        )
        .toPromise()
    }
    setPanel(null)
  }

  const onSubmitAllocation = ({
    addresses,
    description,
    budgetId,
    period = 0,
    balance,
  }) => {
    const emptyIntArray = new Array(addresses.length).fill(0)
    api.setDistribution(
      addresses,
      emptyIntArray, // unused
      emptyIntArray, // unused
      '', // unused
      description,
      emptyIntArray, // unused
      emptyIntArray, // unused
      budgetId, // account or allocation id...budgetId
      '1', // recurrences, 1 for now
      Math.floor(new Date().getTime()/1000), // startTime, now for now
      period,
      balance, // amount
    ).toPromise()
    setPanel(null)
  }

  const onSubmitDeactivate = () => { // TODO id => {
    closeModal()
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

  const onNewAllocation = (budgetId) => {
    const { balances } = appState
    setPanel({
      content: NewAllocation,
      data: {
        budgetId,
        heading: 'New allocation',
        onSubmitAllocation,
        budgets,
        balances,
      },
    })
  }

  const onEdit = id => {
    const editingBudget = budgets.find(budget => budget.id === id)
    setPanel({
      content: NewBudget,
      data: {
        heading: 'Edit budget',
        saveBudget,
        editingBudget,
      },
    })
  }

  const onDeactivate = id => {
    setModalVisible(true)
    setCurrentBudgetId(id)
  }

  const onReactivate = () => { // TODO id => {
    //api.reactivateBudget(id)
  }

  const closeModal = () => {
    setModalVisible(false)
    setCurrentBudgetId('')
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
              <Budgets
                budgets={budgets}
                onNewAllocation={onNewAllocation}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
                onReactivate={onReactivate}
              />
              <SyncIndicator visible={isSyncing} />
            </React.Fragment>
          )
        }
        { !!allocations.length && <AllocationsHistory allocations={allocations} /> }
        <Deactivate
          visible={isModalVisible}
          budgetId={currentBudgetId}
          onClose={closeModal}
          onSubmit={onSubmitDeactivate}
        />
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
