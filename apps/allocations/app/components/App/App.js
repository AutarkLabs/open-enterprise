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
  const { allocations = [], budgets = [], tokens = [] } = appState

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
    budgetId,
    period,
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

  const onSubmitDeactivate = () => { // TODO id => {
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
    setModalVisible(true)
    setCurrentBudgetId(id)
  }

  const onReactivate = () => { // TODO id => {
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
      { allocations.length && <AllocationsHistory allocations={allocations} /> }
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
