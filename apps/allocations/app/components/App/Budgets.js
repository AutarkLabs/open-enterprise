import PropTypes from 'prop-types'
import React, { useState } from 'react'
import styled from 'styled-components'

import { useAragonApi } from '../../api-react'
import { GU } from '@aragon/ui'

import { NewAllocation, NewBudget } from '../Panel'
import { Budget } from '../Card'
import { Deactivate } from '../Modal'

const Budgets = ({ setPanel }) => {
  const { api, appState } = useAragonApi()
  const { budgets = [] } = appState
  const [ isModalVisible, setModalVisible ] = useState(false)
  const [ currentBudgetId, setCurrentBudgetId ] = useState('')

  const closeModal = () => {
    setModalVisible(false)
    setCurrentBudgetId('')
  }

  const saveBudget = ({ id, amount, name }) => {
    api.setBudget(id, amount, name).toPromise()
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

  return (
    <>
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
    </>
  )
}

Budgets.propTypes = {
  setPanel: PropTypes.func.isRequired,
}

const StyledBudgets = styled.div`
  display: grid;
  grid-gap: ${2 * GU}px;
  grid-template-columns: repeat(auto-fill, minmax(${27 * GU}px, 1fr));
  margin-bottom: ${2 * GU}px;
`

export default Budgets
