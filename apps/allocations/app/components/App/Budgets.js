import React from 'react'
import styled from 'styled-components'

import { useAragonApi } from '../../api-react'
import { GU } from '@aragon/ui'

import { Budget } from '../Card'

const Budgets = () => {
  const { appState: { budgets } } = useAragonApi()

  return (
    <StyledBudgets>
      {budgets.map(budget => (
        budget.token && <Budget key={budget.id} budget={budget} />
      ))}
    </StyledBudgets>
  )
}

const StyledBudgets = styled.div`
  display: grid;
  grid-gap: ${2 * GU}px;
  grid-template-columns: repeat(auto-fill, minmax(${27 * GU}px, 1fr));
  margin-bottom: ${2 * GU}px;
`

export default Budgets
