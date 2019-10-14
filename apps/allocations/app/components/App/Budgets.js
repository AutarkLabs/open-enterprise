import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { GU } from '@aragon/ui'

import { Budget } from '../Card'

const Budgets = ({
  budgets,
  onNewAllocation,
  onEdit,
  onDeactivate,
  onReactivate,
}) => {
  return (
    <StyledBudgets>
      {budgets.map(({ remaining, hasBudget, id, name, amount, token }) => (
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
  )
}

Budgets.propTypes = {
  budgets: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
  onReactivate: PropTypes.func.isRequired,
}

const StyledBudgets = styled.div`
  display: grid;
  grid-gap: ${2 * GU}px;
  grid-template-columns: repeat(auto-fill, minmax(${27 * GU}px, 1fr));
  margin-bottom: ${2 * GU}px;
`

export default Budgets
