import React from 'react'
import { AppTitleButton } from '.'
import { usePanelManagement } from '../Panel'

const NewIssueButton = () => {
  const { setupNewIssue } = usePanelManagement()

  return <AppTitleButton caption="New Issue" onClick={setupNewIssue} />
}

// eslint-disable-next-line import/no-unused-modules
export default NewIssueButton
