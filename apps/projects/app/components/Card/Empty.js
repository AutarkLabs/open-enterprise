import React from 'react'
import styled from 'styled-components'
import { EmptyStateCard, unselectable } from '@aragon/ui'
import { IconNewProject } from '../Shared'
import { usePanelManagement } from '../Panel'

const Empty = () => {
  const { setupNewProject } = usePanelManagement()
  return (
    <EmptyWrapper>
      <EmptyStateCard
        title="You have not added any projects."
        text="Get started now by adding a new project."
        icon={<IconNewProject alt="Empty projects icon" />}
        actionText="New Project"
        onActivate={setupNewProject}
      />
    </EmptyWrapper>
  )
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
