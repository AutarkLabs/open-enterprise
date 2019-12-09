import React, { useState } from 'react'
import styled from 'styled-components'

import { useAragonApi } from '../../api-react'
import { Button, GU, Header, IconPlus } from '@aragon/ui'

import { AllocationsHistory } from '.'
import { NewAllocation, NewBudget } from '../Panel'
import { Budget, Empty } from '../Card'
import { Deactivate } from '../Modal'
import { usePanel } from '../../context/Panel'

const Overview = () => {
  const { api, appState } = useAragonApi()
  const { allocations = [], budgets = [], isSyncing = true } = appState
  const [ isModalVisible, setModalVisible ] = useState(false)
  const [ currentBudgetId, setCurrentBudgetId ] = useState('')
  const { setPanel } = usePanel()

  const closeModal = () => {
    setModalVisible(false)
    setCurrentBudgetId('')
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

  const onNewBudget = () => {
    setPanel({
      content: NewBudget,
      data: { heading: 'New budget', saveBudget },
    })
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

  const onNewAllocation = budgetId => {
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

  const onSubmitDeactivate = () => { // TODO id => {
    closeModal()
  }

  const onReactivate = () => { // TODO id => {
    //api.reactivateBudget(id)
  }

  if (budgets.length === 0) {
    return <Empty action={onNewBudget} isSyncing={isSyncing} />
  }

  return (
    <>
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
      <StyledBudgets>
        {budgets.map(({ amount, hasBudget, id, name, remaining, token }) => (
          <Budget
            key={id}
            id={id}
            name={name}
            amount={amount}
            token={token}
            remaining={remaining}
            inactive={!hasBudget}
            onNewAllocation={onNewAllocation}
            onEdit={onEdit}
            onDeactivate={onDeactivate}
            onReactivate={onReactivate}
          />
        ))}
      </StyledBudgets>
      <Deactivate
        visible={isModalVisible}
        budgetId={currentBudgetId}
        onClose={closeModal}
        onSubmit={onSubmitDeactivate}
      />
      { !!allocations.length && <AllocationsHistory allocations={allocations} /> }
    </>
  )
}

const StyledBudgets = styled.div`
  display: grid;
  grid-gap: ${2 * GU}px;
  grid-template-columns: repeat(auto-fill, minmax(${27 * GU}px, 1fr));
  margin-bottom: ${2 * GU}px;
`

export default Overview
