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
                inactive={data.inactive}
                onNewAllocation={onNewAllocation}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
                onReactivate={onReactivate}
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
  onEdit: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
  onReactivate: PropTypes.func.isRequired,
}

const StyledAccounts = styled.div`
  display: flex;
  flex-direction: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? 'column' : 'row'};
  flex-wrap: wrap;
`

export default Budgets
