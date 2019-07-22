import React from 'react'
import { AppTitleButton } from '../../../../../shared/ui'
import { usePanelManagement } from '../Panel'

const NewIssueButton = () => {
  const { setupNewIssue } = usePanelManagement()

  return <AppTitleButton caption="New Issue" onClick={setupNewIssue} />
}

export default NewIssueButton
