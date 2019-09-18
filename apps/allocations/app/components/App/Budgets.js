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
}) => {
  if (!budgets) return

  return (
    <Viewport>
      {({ width }) => {
        const screenSize = width

        return (
          <StyledAccounts screenSize={screenSize}>
            {budgets.map(({ budgetId, data }) => (
              <Budget
                key={budgetId}
                id={budgetId}
                name={data.name}
                amount={data.amount}
                currency={data.currency}
                allocated={data.allocated}
                onNewAllocation={onNewAllocation}
                onEdit={onEdit}
                screenSize={screenSize}
              />
            ))}
          </StyledAccounts>
        )
      }}
    </Viewport>
  )
}

Budgets.propTypes = {
  budgets: PropTypes.arrayOf(PropTypes.object).isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
}

const StyledAccounts = styled.div`
  display: flex;
  flex-direction: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? 'column' : 'row'};
  flex-wrap: wrap;
`

export default Budgets
