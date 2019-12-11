import React from 'react'
import styled from 'styled-components'

import { useAragonApi } from '../../api-react'
import { GU } from '@aragon/ui'

import { NewBudget } from '../Panel'
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

  const onEdit = id => {
    const editingBudget = budgets.find(budget => budget.id === id)
    setPanel({
      content: NewBudget,
      data: {
        heading: editingBudget.active ? 'Edit budget' : 'Reactivate budget',
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
        {budgets.map(({ amount, active, id, name, remaining, token }) => (
          token && <Budget
            key={id}
            id={id}
            name={name}
            amount={amount}
            token={token}
            remaining={remaining}
            active={active}
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
