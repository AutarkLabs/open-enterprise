import React from 'react'
import { Button, IconPlus } from '@aragon/ui'
import { usePanelManagement } from '../Panel'

const NewIssueButton = () => {
  const { setupNewIssue } = usePanelManagement()

  return (
    <Button mode="strong" icon={<IconPlus />} onClick={setupNewIssue} label="New Issue" />
  )
}

// eslint-disable-next-line import/no-unused-modules
export default NewIssueButton
