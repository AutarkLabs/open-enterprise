import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, EmptyStateCard, GU, LoadingRing, unselectable } from '@aragon/ui'
import emptyState from '../../assets/no-budgets.svg'

const illustration = <img src={emptyState} alt="No budgets" height="160" />

const Empty = ({ action, isSyncing }) => (
  <EmptyWrapper>
    <EmptyStateCard
      text={
        isSyncing ? (
          <div
            css={`
              display: grid;
              align-items: center;
              justify-content: center;
              grid-template-columns: auto auto;
              grid-gap: ${1 * GU}px;
            `}
          >
            <LoadingRing />
            <span>Syncing…</span>
          </div>
        ) : (
          'No budgets here'
        )}

      illustration={illustration}
      action={
        <Button onClick={action}>New budget</Button>
      }
    />
  </EmptyWrapper>
)

Empty.propTypes = {
  action: PropTypes.func.isRequired,
  isSyncing: PropTypes.bool.isRequired,
}

const EmptyWrapper = styled.div`
  ${unselectable};
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - ${14 * GU}px);
`

export default Empty
