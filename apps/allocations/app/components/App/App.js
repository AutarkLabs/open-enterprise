import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { useAragonApi } from '../../api-react'
import { Button, Header, IconPlus, Main, SidePanel } from '@aragon/ui'

import { IdentityProvider } from '../../../../../shared/identity'
import { Empty } from '../Card'
import { NewAllocation, NewBudget } from '../Panel'
import { AllocationsHistory, Budgets } from '.'
import { Deactivate } from '../Modal'

const nameSorter = (a, b) => a.data.name.toUpperCase() > b.data.name.toUpperCase() ? 1 : -1

const App = () => {
  const [ panel, setPanel ] = useState(null)
  const [ isModalVisible, setModalVisible ] = useState(false)
  const [ currentBudgetId, setCurrentBudgetId ] = useState('')
  const { api, appState } = useAragonApi()
  const { allocations = [], balances = [], budgets = [], tokens = [] } = appState

  const onCreateBudget = ({ amount, name, token }) => {
    api
      .newAccount(
        name,             // _metadata
        token.address,    // _token
        true,             // hasBudget
        amount
      )
      .toPromise()
    closePanel()
  }

  const onSubmitAllocation = ({
    addresses,
    description,
    payoutId,
    recurring,
    period,
    balance,
    tokenAddress,
  }) => {
    const emptyIntArray = new Array(addresses.length).fill(0)
    api
      .setDistribution(
        addresses,
        emptyIntArray, //[]
        emptyIntArray, //[]
        '',
        description,
        emptyIntArray, // Issue with bytes32 handling
        emptyIntArray, // Issue with bytes32 handling
        payoutId,
        recurring,
        period,
        balance,
        tokenAddress
      )
      .toPromise()
    closePanel()
  }

  const onSubmitDeactivate = id => {
    console.log(`deactivating budget # ${id}...`)
    //api.deactivateBudget(id)
    closeModal()
  }

  const onExecutePayout = (accountId, payoutId) => {
    api.runPayout(accountId, payoutId).toPromise()
  }

  const onNewBudget = () => {
    const fundsLimit = '300000' // remove this!
    setPanel({
      content: NewBudget,
      data: { heading: 'New budget', onCreateBudget, fundsLimit, tokens },
    })
  }

  const onNewAllocation = (address, description, id, balance) => {
    setPanel({
      content: NewAllocation,
      data: {
        heading: 'New Allocation',
        subHeading: description,
        address,
        balance,
        balances,
        id,
        onSubmitAllocation,
      },
    })
  }

  const onEdit = id => {
    const fundsLimit = '300000' // remove this!
    const editingBudget = budgets.find(budget => budget.budgetId === id)
    setPanel({
      content: NewBudget,
      data: {
        heading: 'Edit budget',
        onCreateBudget,
        editingBudget,
        fundsLimit,
      },
    })
  }

  const onDeactivate = id => {
    setModalVisible(true)
    setCurrentBudgetId(id)
  }

  const onReactivate = id => {
    console.log(`reactivating budget # ${id}...`)
    //api.reactivateBudget(id)
  }

  const closePanel = () => {
    setPanel(null)
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

  const Wrap = ({ children }) => (
    <Main scrollView={false}>
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}>
        { children }
        <SidePanel
          title={(panel && panel.data.heading) || ''}
          opened={panel !== null}
          onClose={closePanel}
        >
          {panel && <PanelContent {...panel.data} />}
        </SidePanel>
      </IdentityProvider>
    </Main>
  )

  Wrap.propTypes = {
    children: PropTypes.node.isRequired,
  }

  if (budgets.length === 0) {
    return (
      <Wrap>
        <Empty action={onNewBudget} />
      </Wrap>
    )
  }

  return (
    <Wrap>
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
      <AllocationsHistory allocations={allocations} />
      <Deactivate
        visible={isModalVisible}
        budgetId={currentBudgetId}
        onClose={closeModal}
        onSubmit={onSubmitDeactivate}
      />
    </Wrap>
  )
}

export default App
