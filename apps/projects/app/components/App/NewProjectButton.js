import React from 'react'
import { AppTitleButton } from '../../../../../shared/ui'
import { usePanelManagement } from '../Panel'

const NewProjectButton = () => {
  const { setupNewProject } = usePanelManagement()

  return <AppTitleButton caption="New Project" onClick={setupNewProject} />
}

export default NewProjectButton
