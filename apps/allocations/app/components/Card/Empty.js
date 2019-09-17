import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, EmptyStateCard, GU, unselectable } from '@aragon/ui'
import emptyState from '../../assets/no-budgets.svg'

const illustration = <img src={emptyState} alt="No budgets" height="160" />

const Empty = ({ action }) => (
  <EmptyWrapper>
    <EmptyStateCard
      text="No budgets here"
      illustration={illustration}
      action={
        <Button onClick={action}>New budget</Button>
      }
    />
  </EmptyWrapper>
)

Empty.propTypes = {
  action: PropTypes.func.isRequired,
}

const EmptyWrapper = styled.div`
  ${unselectable};
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - ${14 * GU}px);
`

export default Empty
