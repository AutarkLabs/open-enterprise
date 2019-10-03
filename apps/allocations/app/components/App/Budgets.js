import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Viewport } from '@aragon/ui'

import { CARD_STRETCH_BREAKPOINT } from '../../utils/responsive'
import { Budget } from '../Card'

const Budgets = ({
  budgets,
  onNewAllocation,
  onEdit,
  onDeactivate,
  onReactivate,
}) => {
  return (
    <Viewport>
      {({ width }) => 
        <StyledBudgets screenSize={width}>
          {budgets.map(({ allocated, hasBudget, id, name, amount, token }) => (
            <Budget
              key={id}
              id={id}
              name={name}
              amount={amount}
              token={token.symbol}
              allocated={allocated}
              inactive={!hasBudget}
              onNewAllocation={onNewAllocation}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
              onReactivate={onReactivate}
              screenSize={width}
            />
          ))}
        </StyledBudgets>
      }
    </Viewport>
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
  display: flex;
  flex-direction: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? 'column' : 'row'};
  flex-wrap: wrap;
`

export default Budgets