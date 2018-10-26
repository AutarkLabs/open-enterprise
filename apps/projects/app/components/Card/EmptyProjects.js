import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { EmptyStateCard, unselectable } from '@aragon/ui'
import icon from '../../assets/svg/empty-card-icon.svg'

const Icon = () => <img src={icon} alt="No projects icon" />

const EmptyProjects = ({ action }) => (
  <EmptyWrapper>
    <EmptyStateCard
      title="You have not added any projects."
      text="Get started now by adding a new project."
      icon={Icon}
      actionText="New Project"
      onActivate={action}
    />
  </EmptyWrapper>
)

EmptyProjects.propTypes = {
  action: PropTypes.func.isRequired
}

const EmptyWrapper = styled.div`
  ${unselectable};
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

export default EmptyProjects

