import React from 'react'
import {
  useLayout,
} from '@aragon/ui'
import EventsCard from './EventsCard'
import DetailsCard from './DetailsCard'
import StatusCard from './StatusCard'
import { issueShape } from '../../../utils/shapes.js'

const IssueDetail = ({ issue }) => {
  const { layoutName } = useLayout()
  const columnView = layoutName === 'small' || layoutName === 'medium'

  return columnView ? (
    <div css="display: flex; flex-direction: column">
      <div css={`
          min-width: 330px;
          width: 100%;
          margin-bottom: ${layoutName === 'small' ? '0.2rem' : '2rem'};
        `}
      >
        <DetailsCard issue={issue} />
      </div>
      <div css="min-width: 330px; width: 100%">
        {issue.hasBounty && <StatusCard issue={issue} />}
        <EventsCard issue={issue} />
      </div>
    </div>
  ) : (
    <div css="display: flex; flex-direction: row">
      <div css={`
          max-width: 705px;
          min-width: 350px;
          width: 70%;
          margin-right: 2rem;
        `}
      >
        <DetailsCard issue={issue} />
      </div>
      <div css="flex-grow: 1">
        {issue.hasBounty && <StatusCard issue={issue} />}
        <EventsCard issue={issue} />
      </div>
    </div>
  )
}
  
IssueDetail.propTypes = issueShape

export default IssueDetail
