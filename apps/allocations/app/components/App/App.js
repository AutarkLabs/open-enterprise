import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { useAragonApi } from '../../api-react'
import { Button, Header, IconPlus, Main, Modal, SidePanel } from '@aragon/ui'

import { IdentityProvider } from '../../../../../shared/identity'
import { Empty } from '../Card'
import { NewAllocation, NewBudget } from '../Panel'
import { AllocationsHistory, Budgets } from '.'

const ASSETS_URL = './aragon-ui'

const nameSorter = (a, b) => a.data.name.toUpperCase() > b.data.name.toUpperCase() ? 1 : -1

const App = () => {
  const [ panel, setPanel ] = useState(null)
  const [ modal, setModal ] = useState({ visible: false, budgetId: null })
  const { api, appState } = useAragonApi()
  const {
    // backend stub, remove
    budgets = [
      {
        budgetId: '0',
        data: {
          name: 'Marketing',
          amount: String(80000.123856789012345678e18),
          currency: 'ETH',
          allocated: String(23000e18),
          inactive: false,
        }
      },
      {
        budgetId: '1',
        data: {
          name: 'Hacktivism',
          amount: String(38000.123856789012345678e18),
          currency: 'DAI',
          allocated: String(37200e18),
          inactive: true,
        }
      },
    ],
    balances = [],
    entries = [],
    payouts = [],
    allocations = [],
  } = appState

  const onCreateBudget = ({ description }) => {
    api.newAccount(description).toPromise()
    closePanel()
  }

  const onSubmitAllocation = ({ addresses, description, payoutId, recurring, period, balance, tokenAddress }) => {
    const emptyIntArray = new Array(addresses.length).fill(0)
    api.setDistribution(
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
    ).toPromise()
    closePanel()
  }

  const onSubmitDeactivate = (id) => {
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
      data: { heading: 'New budget', onCreateBudget, fundsLimit }
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

  const onEdit = (id) => {
    const fundsLimit = '300000' // remove this!
    const editingBudget = budgets.find(budget => budget.budgetId === id)
    setPanel({
      content: NewBudget,
      data: {
        heading: 'Edit budget',
        onCreateBudget,
        editingBudget,
        fundsLimit
      }
    })
  }

  const onDeactivate = (id) => {
    setModal({ visible: true, budgetId: id })
  }

  const onReactivate = (id) => {
    console.log(`reactivating budget # ${id}...`)
    //api.reactivateBudget(id)
  }

  const closePanel = () => {
    setPanel(null)
  }

  const closeModal = () => {
    setModal({ visible: false, budgetId: null })
  }

  const handleResolveLocalIdentity = address => api.resolveAddressIdentity(address).toPromise()

  const handleShowLocalIdentityModal = address => api
    .requestAddressIdentityModification(address)
    .toPromise()

  const PanelContent = panel ? panel.content : null

  const Wrap = ({ children }) => (
    <Main assetsUrl={ASSETS_URL}>
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
    return <Wrap><Empty action={onNewBudget} /></Wrap>
  }

  return (
    <Wrap>
      <Header
        primary="Allocations"
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={onNewBudget} label="New budget" />
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
      <DeactivateModal
        state={modal}
        onClose={closeModal}
        onSubmit={onSubmitDeactivate}
      />
    </Wrap>
  )
}

const DeactivateModal = ({ state, onClose, onSubmit }) => {
  const deactivate = () => {
    onSubmit(state.budgetId)
  }
  return (
    <Modal visible={state.visible} onClose={onClose}>
      <div css={{ fontSize: '26px' }}>
        Deactivate budget
      </div>
      <div css={{ marginTop: '32px' }}>
        Deactivating this budget will immediately disable it once the decision is enacted. You may choose to reactivate this budget at any time.
      </div>
      <div css={{
        marginTop: '48px',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <Button
          label="Cancel"
          css={{ marginRight: '8px' }}
          onClick={onClose}
        />
        <Button
          label="Deactivate"
          mode="negative"
          onClick={deactivate}
        />
      </div>
    </Modal>
  )
}

DeactivateModal.propTypes = {
  state: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

export default App
