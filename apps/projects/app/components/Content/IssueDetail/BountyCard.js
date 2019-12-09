import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Box,
  Button,
  GU,
  IconAddUser,
  IconClock,
  IconFile,
  IconGraph2,
  IdentityBadge,
  Link,
  Text,
  useTheme,
} from '@aragon/ui'
import { issueShape } from '../../../utils/shapes.js'
import { usePanelManagement } from '../../Panel'
import { useAragonApi } from '../../../api-react'
import { formatDistance } from 'date-fns'
import { IconDoubleCheck, IconUserCheck } from '../../../assets'

const ActionButton = ({ panel, caption, issue }) => (
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
ActionButton.propTypes = {
  panel: PropTypes.func.isRequired,
  caption: PropTypes.string.isRequired,
  issue: issueShape,
}

const address = address => (
  <div css={`margin-left: ${GU}px`}>
    <IdentityBadge entity={address} />
  </div>
)

const DeadlineDistance = ({ date }) =>
  formatDistance(new Date(date), new Date(), { addSuffix: true })

const pluralize = (word, number) => `${number} ${word}${number > 1 ? 's' : ''}`

const Status = ({ issue }) => {
  const theme = useTheme()

  switch(issue.workStatus) {
  case 'funded':
  case 'review-applicants': return (
    <>
      <IconAddUser color={`${theme.surfaceIcon}`} />
      <BountyText>
        Accepting applications
      </BountyText>
    </>
  )
  case 'fulfilled': return (
    <>
      <IconDoubleCheck />
      <BountyText>
        Completed by {address(issue.assignee)}
      </BountyText>
    </>
  )
  default: return (
    <>
      <IconUserCheck />
      <BountyText>
        Assigned to {address(issue.assignee)}
      </BountyText>
    </>
  )
  }
}
Status.propTypes = issueShape

const Submissions = ({ issue }) => {
  const { reviewApplication, reviewWork } = usePanelManagement()

  switch(issue.workStatus) {
  case 'funded': return (
    'No applications'
  )
  case 'review-applicants': return (
    <Link onClick={() => reviewApplication(issue, 0)}>
      {pluralize('application', issue.requestsData.length)}

    </Link>
  )
  case 'in-progress':
    if ('workSubmissions' in issue) return (
      <Link onClick={() => reviewWork(issue, 0)}>
        {pluralize('work submission', issue.workSubmissions.length)}
      </Link>
    )
    return (
      'No work submissions'
    )
  case 'review-work':
  case 'fulfilled': return (
    <Link onClick={() => reviewWork(issue, 0)}>
      {pluralize('work submission', issue.workSubmissions.length)}
    </Link>)
  default: return null
  }
}
Submissions.propTypes = issueShape

const Dot = ({ color }) => (
  <div css={`
    margin-right: ${GU}px;
    margin-top: ${1.2 * GU}px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${color};
  `} />
)
Dot.propTypes = PropTypes.string.isRequired

const BountyDot = ({ workStatus }) => {
  const theme = useTheme()

  switch(workStatus) {
  case 'funded':
  case 'review-applicants':
    return (
      <Dot color={theme.success} />
    )
  case 'in-progress':
  case 'review-work':
    return (
      <Dot color={theme.warning} />
    )
  default: return null
  }
}
BountyDot.propTypes = PropTypes.string.isRequired

const Action = ({ issue }) => {
  const { requestAssignment, submitWork } = usePanelManagement()
  const { connectedAccount } = useAragonApi()

  switch(issue.workStatus) {
  case 'funded':
  case 'review-applicants':
    return (
      <ActionButton panel={requestAssignment} caption="Submit application" issue={issue} />
    )
  case 'in-progress':
    if (connectedAccount === issue.assignee) return (
      <ActionButton panel={submitWork} caption="Submit work" issue={issue} />
    )
    return null
  default: return null
  }
}
Action.propTypes = issueShape

const BountyCard = ({ issue }) => {
  const theme = useTheme()
  const { appState: { bountySettings } } = useAragonApi()
  const expLevels = bountySettings.expLvls

  return (
    <Box
      heading="Bounty"
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
        <BountyDot workStatus={issue.workStatus} />
        <div css="display: flex; align-items: baseline">
          <Text size="xxlarge">{issue.balance}</Text>
          <Text color={`${theme.surfaceContentSecondary}`} css="margin-left: 2px">{issue.symbol}</Text>
        </div>
      </div>

      <Row>
        <Status issue={issue} />
      </Row>

      <Row>
        <IconClock color={`${theme.surfaceIcon}`} />
        <BountyText>Due <DeadlineDistance date={issue.deadline} /></BountyText>
      </Row>

      <Row>
        <IconGraph2 color={`${theme.surfaceIcon}`} />
        <BountyText>{expLevels[issue.exp].name}</BountyText>
      </Row>

      <Row>
        <IconFile color={`${theme.surfaceIcon}`} />
        <BountyText>
          <Submissions issue={issue} />
        </BountyText>
      </Row>

      <Action issue={issue} />
    </Box>
  )
}

BountyCard.propTypes = issueShape

const EventButton = styled(Button)`
  margin-top: ${2 * GU}px;
  padding: 5px 20px 2px 20px;
  font-size: 15px;
  border-radius: 5px;
`
const Row = styled.div`
  display: flex;
  margin-bottom: ${GU}px;
`
const BountyText = styled.div`
  margin-left: ${GU}px;
  margin-top: ${.2 * GU}px;
  display: flex;
`

export default BountyCard
