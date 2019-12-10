import React from 'react'
import styled from 'styled-components'

import { useAragonApi } from '../../api-react'
import { GU } from '@aragon/ui'

import { NewAllocation, NewBudget } from '../Panel'
import { Budget } from '../Card'
import { usePanel } from '../../context/Panel'

const Budgets = () => {
  const { api, appState } = useAragonApi()
  const { budgets = [] } = appState
  const { setPanel } = usePanel()

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
        heading: editingBudget.amount > 0 ? 'Edit budget' : 'Reactivate budget',
        saveBudget,
        editingBudget,
      },
    })
  }

  const onDeactivate = id => {
    const thisBudget = budgets.find(budget => budget.id === id)
    if(thisBudget){
      saveBudget({
        id,
        amount: 0,
        name: thisBudget.name
      })
    }
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
          />
        ))}
      </StyledBudgets>
    </>
  )
}

const StyledBudgets = styled.div`
  display: grid;
  grid-gap: ${2 * GU}px;
  grid-template-columns: repeat(auto-fill, minmax(${27 * GU}px, 1fr));
  margin-bottom: ${2 * GU}px;
`

export default Budgets
