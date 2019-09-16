import React from 'react'
import { AppTitleButton } from '.'
import { usePanelManagement } from '../Panel'

const NewProjectButton = () => {
  const { setupNewProject } = usePanelManagement()

  return <AppTitleButton caption="New Project" onClick={setupNewProject} />
}

// eslint-disable-next-line import/no-unused-modules
export default NewProjectButton
