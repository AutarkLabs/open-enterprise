import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Box,
  Button,
  GU,
  IconCircleCheck,
  IconCoin,
  IconInfo,
  IdentityBadge,
  Text,
  useTheme,
} from '@aragon/ui'
import { issueShape } from '../../../utils/shapes.js'
import { usePanelManagement } from '../../Panel'
import { useAragonApi } from '../../../api-react'

const Action = ({ panel, caption, issue }) => (
  <EventButton
    mode="normal"
    wide
    onClick={() => panel(issue)}
  >
    <Text size="large">
      {caption}
    </Text>
  </EventButton>
)
Action.propTypes = {
  panel: PropTypes.func.isRequired,
  caption: PropTypes.string.isRequired,
  issue: PropTypes.oneOfType([
    issueShape,
    PropTypes.arrayOf(issueShape),
  ]).isRequired,
}

const address = address => (
  <div css={`margin-top: ${GU}px`}>
    <IdentityBadge entity={address} />
  </div>
)

const plural = number => number > 1 ? 's' : ''

const determineStatus = issue => {
  const theme = useTheme()

  const statusData = [
    { status: 'not-funded', text: 'Not funded', color: theme.surfaceContentSecondary },
    { status: 'funded', text: 'Accepting applications', color: theme.positiveSurfaceContent },
    { status: 'assigned', text: 'Assigned to', color: theme.warningSurfaceContent },
    { status: 'review-work', text: 'Work for review by', color: theme.warningSurfaceContent },
    { status: 'fulfilled', text: 'Bounty completed by', color: theme.surfaceContentSecondary },
  ]

  if (issue.workStatus === 'funded' || issue.workStatus === 'review-applicants') {
    if ('requestsData' in issue) {
      statusData[1]['subtext'] = (
        <div>
          {issue.requestsData.length + ' application' + plural(issue.requestsData.length) + ' submitted'}
        </div>
      )
    }
    return statusData[1]
  }
  if (issue.workStatus === 'in-progress') {
    return { ...statusData[2], subtext: address(issue.assignee) }
  }
  if (issue.workStatus === 'review-work') {
    return { ...statusData[3], subtext: address(issue.assignee) }
  }
  if (issue.workStatus === 'fulfilled') {
    return { ...statusData[4], subtext: address(issue.assignee) }
  }
  return statusData[0]
}

const StatusCard = ({ issue }) => {
  const theme = useTheme()
  const { connectedAccount } = useAragonApi()

  const { allocateBounty, requestAssignment, reviewApplication, reviewWork, submitWork } = usePanelManagement()

  const { color, status, subtext, text } = determineStatus(issue)
  
  const isOpen = status !== 'fulfilled'

  return (
    <Box
      heading="Status"
      padding={3 * GU}
      css={`
        flex: 0 1 auto;
        text-align: left;
        background: ${theme.surface};
        border: 1px solid ${theme.border};
        border-radius: 3px;
        padding: 0;
      `}
    >
      <div css={`display: flex; margin-bottom: ${2 * GU}px`}>
        {isOpen ?
          <>
            <IconInfo color={`${theme.positiveSurfaceContent}`} />
            <StatusText>Open</StatusText>
          </> : <>
            <IconCircleCheck color={`${theme.surfaceContentSecondary}`} />
            <StatusText>Closed</StatusText>
          </>
        }
      </div>

      <div css={`display: flex; margin-bottom: ${3 * GU}px`}>
        <IconCoin color={`${color}`} />
        <StatusText>
          {text}
          {subtext && subtext}
        </StatusText>
      </div>

      {status === 'not-funded' && (
        <Action panel={allocateBounty} caption="Fund issue" issue={[issue]} />
      )}
      {issue.workStatus === 'funded' && (
        <Action panel={requestAssignment} caption="Submit application" issue={issue} />
      )}
      {issue.workStatus === 'review-applicants' && (
        <>
          <Action panel={requestAssignment} caption="Submit application" issue={issue} />
          <Action
            panel={reviewApplication}
            caption={'View application' + plural(issue.requestsData.length)}
            issue={issue}
          />
        </>
      )}
      {issue.workStatus === 'in-progress' && (
        <>
          {connectedAccount === issue.assignee && (
            <Action panel={submitWork} caption="Submit work" issue={issue} />
          )}
          <Action panel={reviewApplication} caption="View application" issue={issue} />
        </>
      )}
      {(issue.workStatus === 'review-work' || issue.workStatus === 'fulfilled') && (
        <>
          <Action panel={reviewWork} caption="View work" issue={issue} />
          <Action panel={reviewApplication} caption="View application" issue={issue} />
        </>
      )}

    </Box>
  )
}

StatusCard.propTypes = issueShape

const StatusText = styled.div`
  margin-left: ${.5 * GU}px;
  margin-top: 3px;
`

const EventButton = styled(Button)`
  margin-top: ${2 * GU}px;
  padding: 5px 20px 2px 20px;
  font-size: 15px;
  border-radius: 5px;
`

// eslint-disable-next-line import/no-unused-modules
export default StatusCard
