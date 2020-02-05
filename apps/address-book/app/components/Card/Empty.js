import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, EmptyStateCard, GU, Link, LoadingRing } from '@aragon/ui'
import emptyStatePng from '../../assets/no-contacts.png'

const illustration = <img src={emptyStatePng} alt="" height="160" />

// We need a third item on the page so flex box placement puts the card in the
// center and the info box at the top
const Spacer = () => <span>&nbsp;</span>

const BetterLink = styled(Link)`
  display: inline;
  white-space: initial;
`

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
          'No entities here!'
        )}
      illustration={illustration}
      actionText="New Entity"
      action={
        <Button onClick={action}>New entity</Button>
      }
    />
    <Spacer />
  </EmptyWrapper>
)

Empty.propTypes = {
  action: PropTypes.func.isRequired,
  isSyncing: PropTypes.bool.isRequired,
}

const EmptyWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${14 * GU}px);
  justify-content: space-between;
`

export default Empty
