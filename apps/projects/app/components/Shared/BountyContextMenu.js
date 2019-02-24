import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { ContextMenuItem } from '@aragon/ui'

const BountyContextMenu = ({workStatus, requestsData, onAllocateSingleBounty, onSubmitWork, onRequestAssignment, onReviewApplication, onReviewWork}) => <div>
  {workStatus === undefined &&
    <ContextMenuItem onClick={onAllocateSingleBounty}>
      <ActionLabel>Allocate Bounty</ActionLabel>
    </ContextMenuItem>
  }
  {(workStatus === 'submit-work' || workStatus === 'review-work') &&
    <div>
      <ContextMenuItem onClick={onSubmitWork}>
        <ActionLabel>Submit Work</ActionLabel>
      </ContextMenuItem>
      <ContextMenuItem onClick={onReviewWork}>
        <ActionLabel>Review Work</ActionLabel>
      </ContextMenuItem>
    </div>
  }
  {(workStatus === 'new' || workStatus === 'review-applicants') &&
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
  workStatus: PropTypes.oneOf([undefined, 'new', 'review-applicants', 'submit-work', 'review-work', 'finished']),
}

export default BountyContextMenu

