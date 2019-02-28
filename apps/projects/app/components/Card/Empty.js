import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { EmptyStateCard, unselectable } from '@aragon/ui'
import { IconNewProject } from '../Shared'

const Empty = ({ action }) => (
  <EmptyWrapper>
    <EmptyStateCard
      title="You have not added any projects."
      text="Get started now by adding a new project."
      icon={<IconNewProject alt="Empty projects icon" />}
      actionText="New Project"
      onActivate={action}
    />
  </EmptyWrapper>
)

Empty.propTypes = {
  action: PropTypes.func.isRequired,
}

const EmptyWrapper = styled.div`
  ${unselectable};
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 64px - 38px);
`

export default Empty
