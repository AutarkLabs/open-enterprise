import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Box,
  useTheme,
  GU,
  Text,
  Button,
} from '@aragon/ui'
import { issueShape } from '../../../utils/shapes.js'
import { usePanelManagement } from '../../Panel'
import { BOUNTY_STATUS_LONG } from '../../../utils/bounty-status'

const Action = ({ panel, caption, issue }) => (
  <EventButton
    mode="normal"
    wide
    onClick={() => panel(issue)}
  >
    <Text weight="bold">
      {caption}
    </Text>
  </EventButton>
)
Action.propTypes = {
  panel: PropTypes.func.isRequired,
  caption: PropTypes.string.isRequired,
  issue: issueShape,
}

const StatusCard = ({ issue }) => {
  const theme = useTheme()
  const { submitWork, requestAssignment, reviewApplication, reviewWork } = usePanelManagement()

  const determineStatus = (workStatus, balance) =>
    Number(balance) === 0 ? BOUNTY_STATUS_LONG['fulfilled'] : BOUNTY_STATUS_LONG[workStatus]

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
      <Text.Block>
        {determineStatus(issue.workStatus)}
      </Text.Block>

      {issue.workStatus === 'funded' && (
        <Action panel={requestAssignment} caption="Submit application" issue={issue} />
      )}
      {issue.workStatus === 'review-applicants' && (
        <React.Fragment>
          <Action panel={requestAssignment} caption="Submit application" issue={issue} />
          <Action panel={reviewApplication} caption="View applications" issue={issue} />
        </React.Fragment>
      )}
      {issue.workStatus === 'in-progress' && (
        <Action panel={submitWork} caption="Submit work" issue={issue} />
      )}
      {issue.workStatus === 'review-work' && (
        <Action panel={reviewWork} caption="View work" issue={issue} />
      )}

    </Box>
  )
}

StatusCard.propTypes = issueShape

const EventButton = styled(Button)`
  margin-top: ${2 * GU}px;
  padding: 5px 20px 2px 20px;
  font-size: 15px;
  border-radius: 5px;
`

// eslint-disable-next-line import/no-unused-modules
export default StatusCard
