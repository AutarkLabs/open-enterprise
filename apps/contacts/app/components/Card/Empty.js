import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, EmptyStateCard, GU, unselectable } from '@aragon/ui'
import emptyStatePng from '../../assets/no-contacts.png'

const illustration = <img src={emptyStatePng} alt="" height="160" />

const Empty = ({ action }) => (
  <EmptyWrapper>
    <EmptyStateCard
      text="No contacts here"
      illustration={illustration}
      actionText="New contact"
      action={
        <Button onClick={action}>New contact</Button>
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

