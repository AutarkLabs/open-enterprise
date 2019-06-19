import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import styled, { css } from 'styled-components'
import { ContextMenuItem, theme } from '@aragon/ui'
import { PANELS, PanelContext } from '../Panel'

const onViewFunding = ({ issue, setActivePanel, setPanelProps }) => {
  const fundingEventId = issue.id // FIXME: what attribute links issues from the same funding event?
  setActivePanel(PANELS.ViewFunding)
  setPanelProps({
    createdBy: issue.fundingHistory[0].user, // FIXME: does not contain Eth address; how to retrieve it?
    fundingEventId,
    title: 'Issue Funding #Unknown',
  })
}

const BountyContextMenu = ({
  issue,
  work,
  workStatus,
  requestsData,
  onAllocateSingleBounty,
  onUpdateBounty,
  onSubmitWork,
  onRequestAssignment,
  onReviewApplication,
  onReviewWork,
}) => {

  const { setActivePanel, setPanelProps } = useContext(PanelContext)

  const viewFunding = () => onViewFunding({ issue, setActivePanel, setPanelProps })

  return (
    <React.Fragment>
      {workStatus === undefined && (
        <Item onClick={onAllocateSingleBounty}>Fund Issue</Item>
      )}
      {workStatus === 'in-progress' && (
        <React.Fragment>
          <Item onClick={onSubmitWork}>Submit Work</Item>
          <Item bordered onClick={viewFunding}>
            View Funding Proposal
          </Item>
        </React.Fragment>
      )}
      {workStatus === 'review-work' && (
        <React.Fragment>
          <Item onClick={onReviewWork}>Review Work</Item>
          <Item bordered onClick={viewFunding}>
            View Funding Proposal
          </Item>
        </React.Fragment>
      )}
      {workStatus === 'funded' && (
        <React.Fragment>
          <Item onClick={onRequestAssignment}>Request Assignment</Item>
          <Item bordered onClick={onUpdateBounty}>
            Update Funding
          </Item>
          <Item onClick={viewFunding}>View Funding Proposal</Item>
        </React.Fragment>
      )}
      {workStatus === 'review-applicants' && (
        <React.Fragment>
          <Item onClick={onReviewApplication}>
            Review Application ({requestsData.length})
          </Item>
          <Item bordered onClick={onUpdateBounty}>
            Update Funding
          </Item>
          <Item onClick={viewFunding}>View Funding Proposal</Item>
        </React.Fragment>
      )}
      {workStatus === 'fulfilled' && (
        <Item onClick={viewFunding}>View Funding Proposal</Item>
      )}
    </React.Fragment>
  )
}

const Item = styled(ContextMenuItem)`
  ${props =>
    props.bordered &&
    css`
      border-top: 1px solid ${theme.shadow};
      margin-top: 10px;
      padding-top: 10px;
    `};
`

BountyContextMenu.propTypes = {
  onAllocateSingleBounty: PropTypes.func.isRequired,
  onSubmitWork: PropTypes.func.isRequired,
  onRequestAssignment: PropTypes.func.isRequired,
  onReviewApplication: PropTypes.func.isRequired,
  onReviewWork: PropTypes.func.isRequired,
  onUpdateBounty: PropTypes.func.isRequired,
  work: PropTypes.oneOf([ undefined, PropTypes.object ]),
  workStatus: PropTypes.oneOf([
    undefined,
    'funded',
    'review-applicants',
    'in-progress',
    'review-work',
    'fulfilled',
  ]),
}

export default BountyContextMenu
