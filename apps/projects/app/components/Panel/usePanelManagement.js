import { useContext } from 'react'
import { PANELS, PanelContext } from '../Panel'

const usePanelManagement = () => {
  const { setActivePanel, setPanelProps } = useContext(PanelContext)
  return {
    allocateBounty: issues => {
      setActivePanel(PANELS.FundIssues)
      setPanelProps({
        issues,
        mode: 'new',
      })
    },
    closePanel: () => {
      setActivePanel(null)
      setPanelProps({})
    },
    curateIssues: (selectedIssues, allIssues) => {
      setActivePanel(PANELS.NewIssueCuration)
      setPanelProps({
        selectedIssues,
        allIssues,
      })
    },
    viewFunding: issue => {
      const fundingEventId = issue.id // FIXME: what attribute links issues from the same funding event?
      setActivePanel(PANELS.ViewFunding)
      setPanelProps({
        createdBy: issue.fundingHistory[0].user, // FIXME: does not contain Eth address; how to retrieve it?
        fundingEventId,
        title: 'Issue Funding #Unknown',
      })
    },
  }
}

export default usePanelManagement
