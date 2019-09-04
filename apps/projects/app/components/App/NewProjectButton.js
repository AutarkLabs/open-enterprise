import React from 'react'
import { Button, IconPlus } from '@aragon/ui'
import { usePanelManagement } from '../Panel'

const NewProjectButton = () => {
  const { setupNewProject } = usePanelManagement()

  return (
    <Button mode="strong" icon={<IconPlus />} onClick={setupNewProject} label="New Project" />
  )
}

// eslint-disable-next-line import/no-unused-modules
export default NewProjectButton
