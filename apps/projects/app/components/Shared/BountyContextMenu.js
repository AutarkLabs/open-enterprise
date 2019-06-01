import PropTypes from 'prop-types'
import React from 'react'
import styled, { css } from 'styled-components'
import { ContextMenuItem, theme } from '@aragon/ui'

const BountyContextMenu = ({
  work,
  workStatus,
  requestsData,
  onAllocateSingleBounty,
  onUpdateBounty,
  onViewBounty,
  onSubmitWork,
  onRequestAssignment,
  onReviewApplication,
  onReviewWork,
}) => (
  <React.Fragment>
    {workStatus === undefined && (
      <Item onClick={onAllocateSingleBounty}>Fund Issue</Item>
    )}
    {workStatus === 'in-progress' && (
      <React.Fragment>
        <Item onClick={onSubmitWork}>Submit Work</Item>
        <Item bordered onClick={onViewBounty}>
          View Funding Proposal
        </Item>
      </React.Fragment>
    )}
    {workStatus === 'review-work' && (
      <React.Fragment>
        <Item onClick={onReviewWork}>Review Work</Item>
        <Item bordered onClick={onViewBounty}>
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
        <Item onClick={onViewBounty}>View Funding Proposal</Item>
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
        <Item onClick={onViewBounty}>View Funding Proposal</Item>
      </React.Fragment>
    )}
    {workStatus === 'fulfilled' && (
      <Item onClick={onViewBounty}>View Funding Proposal</Item>
    )}
  </React.Fragment>
)

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
  onViewBounty: PropTypes.func,
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

BountyContextMenu.defaultProps = {
  onViewBounty: () => {
    console.log(
      '%c "View Funding Proposal" is coming soon!',
      `color: ${theme.accent}; font-size: 2em;`
    )
  },
}

export default BountyContextMenu
