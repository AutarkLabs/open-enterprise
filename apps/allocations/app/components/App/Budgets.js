import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { GU } from '@aragon/ui'

import { Budget } from '../Card'

const Budgets = ({
  budgets,
  onNewAllocation,
  onEdit,
}) => {
  return (
    <StyledBudgets>
      {budgets.map(({ remaining, id, name, amount, token }) => (
        <Budget
          key={id}
          id={id}
          name={name}
          amount={amount}
          token={token}
          remaining={remaining}
          onNewAllocation={onNewAllocation}
          onEdit={onEdit}
        />
      ))}
    </StyledBudgets>
  )
}

Budgets.propTypes = {
  budgets: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
}

const StyledBudgets = styled.div`
  display: grid;
  grid-gap: ${2 * GU}px;
  grid-template-columns: repeat(auto-fill, minmax(${27 * GU}px, 1fr));
  margin-bottom: ${2 * GU}px;
`

export default Budgets
