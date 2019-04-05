import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { ContextMenuItem } from '@aragon/ui'

const BountyContextMenu = ({
  work,
  workStatus,
  requestsData,
  onAllocateSingleBounty,
  onSubmitWork,
  onRequestAssignment,
  onReviewApplication,
  onReviewWork
}) => <div>
  {workStatus === undefined &&
    <ContextMenuItem onClick={onAllocateSingleBounty}>
      <ActionLabel>Fund Issue</ActionLabel>
    </ContextMenuItem>
  }
  {workStatus === 'in-progress' &&
    <ContextMenuItem onClick={onSubmitWork}>
      <ActionLabel>Submit Work</ActionLabel>
    </ContextMenuItem>
  }
  {workStatus === 'review-work' &&
    <ContextMenuItem onClick={onReviewWork}>
      <ActionLabel>Review Work</ActionLabel>
    </ContextMenuItem>
  }
  {(workStatus === 'funded' || workStatus === 'review-applicants') &&
    <ContextMenuItem onClick={onRequestAssignment}>
      <ActionLabel>Request Assignment</ActionLabel>
    </ContextMenuItem>
  }
  {workStatus === 'review-applicants' &&
    <ContextMenuItem onClick={onReviewApplication}>
      <ActionLabel>Review Application ({requestsData.length})</ActionLabel>
    </ContextMenuItem>
  }
</div>

const ActionLabel = styled.span`
  margin-left: 15px;
`

BountyContextMenu.propTypes = {
  onAllocateSingleBounty: PropTypes.func.isRequired,
  onSubmitWork: PropTypes.func.isRequired,
  onRequestAssignment: PropTypes.func.isRequired,
  onReviewApplication: PropTypes.func.isRequired,
  onReviewWork: PropTypes.func.isRequired,
  work: PropTypes.oneOf([
    undefined,
    PropTypes.object,
  ]),
  workStatus: PropTypes.oneOf([ undefined, 'funded', 'review-applicants', 'in-progress', 'review-work', 'fulfilled' ]),
}

export default BountyContextMenu
