import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { useAragonApi } from '../../api-react'
import { Button, Header, IconPlus, Modal, SidePanel } from '@aragon/ui'

import { IdentityProvider } from '../../../../../shared/identity'
import { Empty } from '../Card'
import { NewAllocation, NewBudget } from '../Panel'
import { AllocationsHistory, Budgets } from '.'

const App = () => {
  const [ panel, setPanel ] = useState(null)
  const [ modal, setModal ] = useState({ visible: false, budgetId: null })
  const { api, appState } = useAragonApi()
  const { allocations = [], balances = [], budgets = [], tokens = [] } = appState

  const onCreateBudget = ({ amount, name, token }) => {
    console.log('amount: ', amount)
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
    budgetId,
    recurring,
    period,
    balance,
    tokenAddress,
  }) => {
    const emptyIntArray = new Array(addresses.length).fill(0)
    console.log('budgetId: ', budgetId, ' balance: ', balance)
    console.table({
      addresses,
      description,
      budgetId,
      recurring,
      period,
      balance,
      tokenAddress,
    })
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
      String(balance), // amount
      // tokenAddress -> token used, now deprecated
    ).toPromise()
    closePanel()

    // address[] _candidateAddresses,
    // uint256[] _supports,
    // uint256[] /*unused_infoIndices*/,
    // string /*unused_candidateInfo*/,
    // string _description,
    // uint256[] /*unused_level 1 ID - converted to bytes32*/,
    // uint256[] /*unused_level 2 ID - converted to bytes32*/,
    // uint64 _accountId,
    // uint64 _recurrences,
    // uint64 _startTime,
    // uint64 _period,
    // uint256 _amount
  }

  const onSubmitDeactivate = id => {
    console.log(`deactivating budget # ${id}...`)
    //api.deactivateBudget(id)
    closeModal()
  }

  // TODO: Fix this
  // eslint-disable-next-line
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

  const onNewAllocation = (id, description, balance, token) => {
    console.log('budgetId: ', id)
    setPanel({
      content: NewAllocation,
      data: {
        heading: 'New Allocation',
        subHeading: description,
        balance,
        balances: [token],
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
    setModal({ visible: true, budgetId: id })
  }

  const onReactivate = id => {
    console.log(`reactivating budget # ${id}...`)
    //api.reactivateBudget(id)
  }

  const closePanel = () => {
    setPanel(null)
  }

  const closeModal = () => {
    setModal({ visible: false, budgetId: null })
  }

  const handleResolveLocalIdentity = address =>
    api.resolveAddressIdentity(address).toPromise()

  const handleShowLocalIdentityModal = address =>
    api.requestAddressIdentityModification(address).toPromise()

  const PanelContent = panel ? panel.content : null

  const Wrap = ({ children }) => (
    <IdentityProvider
      onResolve={handleResolveLocalIdentity}
      onShowLocalIdentityModal={handleShowLocalIdentityModal}
    >
      {children}
      <SidePanel
        title={(panel && panel.data.heading) || ''}
        opened={panel !== null}
        onClose={closePanel}
      >
        {panel && <PanelContent {...panel.data} />}
      </SidePanel>
    </IdentityProvider>
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
      <div css={{ fontSize: '26px' }}>Deactivate budget</div>
      <div css={{ marginTop: '32px' }}>
        Deactivating this budget will immediately disable it once the decision
        is enacted. You may choose to reactivate this budget at any time.
      </div>
      <div
        css={{
          marginTop: '48px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button label="Cancel" css={{ marginRight: '8px' }} onClick={onClose} />
        <Button label="Deactivate" mode="negative" onClick={deactivate} />
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
