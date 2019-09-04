import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import {
  Badge,
  Text,
  useTheme,
  SafeLink,
  Button,
} from '@aragon/ui'
import { formatDistance } from 'date-fns'
import { usePanelManagement } from '../../Panel'
import Label from './Label'

const IssueEventAvatar = styled.div`
  width: 66px;
  margin: 0;
`
const IssueEventMain = styled.div`
  display: flex;
`
const IssueEventDetails = styled.div`
  > * {
    margin-bottom: 10px;
  }
`
const EventButton = styled(Button)`
  padding: 5px 20px 2px 20px;
  font-size: 15px;
  border-radius: 5px;
`

const IssueEvent = props => {
  const theme = useTheme()

  return (
    <IssueEventMain>
      <IssueEventAvatar>
        <img src={props.avatarUrl} alt="user avatar" css="width: 50px" />
      </IssueEventAvatar>
      <IssueEventDetails>
        <Text.Block size="small">
          <SafeLink
            href={props.url}
            target="_blank"
            style={{ textDecoration: 'none', color: '#21AAE7' }}
          >
            {props.login}
          </SafeLink>{' '}
          {props.eventDescription}
        </Text.Block>

        {props.eventMessage && (
          <Text.Block size="large">{props.eventMessage}</Text.Block>
        )}
        {props.eventAction && <div>{props.eventAction}</div>}
        <Text.Block size="xsmall" color={theme.surfaceContentSecondary}>
          {calculateAgo(props.date)}
        </Text.Block>
      </IssueEventDetails>
    </IssueEventMain>
  )
}

IssueEvent.propTypes = {
  avatarUrl: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  login: PropTypes.string.isRequired,
  eventDescription: PropTypes.string.isRequired,
  eventMessage: PropTypes.string,
  eventAction: PropTypes.string,
  date: PropTypes.string.isRequired,
}

const calculateAgo = pastDate => {
  const date = Date.now()
  return formatDistance(pastDate, date, { addSuffix: true })
}

const activities = (
  issue,
  requestsData,
  workSubmissions,
  fundingHistory,
  onReviewApplication,
  onReviewWork
) => {
  const theme = useTheme()
  const events = []

  if (requestsData) {
    requestsData.forEach((data, index) => {
      events[data.applicationDate] = {
        date: data.applicationDate,
        ...data.user,
        eventDescription: 'requested assignment',
        eventAction: (
          <EventButton
            mode="outline"
            onClick={() => onReviewApplication(issue, index)}
          >
            {'review' in data ? 'View' : 'Review'} Application
          </EventButton>
        ),
      }

      if ('review' in data) {
        events[data.review.reviewDate] = {
          date: data.review.reviewDate,
          ...data.review.user,
          eventDescription: data.review.approved
            ? 'assigned ' + data.user.login
            : 'rejected ' + data.user.login,
          eventAction:
            data.review.feedback.length === 0 ? null : (
              <Text>{data.review.feedback}</Text>
            ),
        }
      }
    })
  }

  if (workSubmissions) {
    workSubmissions.forEach((data, index) => {
      events[data.submissionDate] = {
        date: data.submissionDate,
        ...data.user,
        eventDescription: 'submitted work for review',
        eventAction: (
          <EventButton
            mode="outline"
            onClick={() => onReviewWork(issue, index)}
          >
            {'review' in data ? 'View' : 'Review'} Work
          </EventButton>
        ),
      }

      if ('review' in data) {
        events[data.review.reviewDate] = {
          date: data.review.reviewDate,
          ...data.review.user,
          eventDescription: data.review.accepted
            ? 'accepted ' + data.user.login + '\'s work'
            : 'rejected ' + data.user.login + '\'s work',
          eventAction:
            data.review.feedback.length === 0 ? (
              <Badge
                foreground={theme.surfaceContentSecondary}
                background={theme.border}
              >
                Quality: {data.review.rating}
              </Badge>
            ) : (
              <div>
                <Text.Block size="large" style={{ marginBottom: '8px' }}>
                  {data.review.feedback}
                </Text.Block>
                <Badge
                  foreground={theme.surfaceContentSecondary}
                  background={theme.border}
                >
                  Quality: {data.review.rating}
                </Badge>
              </div>
            ),
        }
      }
    })
  }

  if (fundingHistory) {
    fundingHistory.forEach((data, i) => {
      events[data.date] = {
        date: data.date,
        ...data.user,
        eventDescription: (i === 0 ? ' added' : ' updated') + ' funding',
      }
    })
  }

  return events
}

const EventsCard = ({ issue }) => {
  const theme = useTheme()
  const { reviewApplication, reviewWork } = usePanelManagement()
  const issueEvents = activities(
    issue,
    issue.requestsData,
    issue.workSubmissions,
    issue.fundingHistory,
    reviewApplication,
    reviewWork
  )

  return (
    <div css={`
      flex: 0 1 auto;
      text-align: left;
      background: ${theme.surface};
      border: 1px solid ${theme.border};
      border-radius: 3px;
      padding: 20px 10px 0 10px;
      > * {
        padding: 16px 0 6px 16px;
      }
      > :not(:last-child) {
        margin-bottom: 0;
      }
      > :not(:last-child) :not(:first-child) {
        border-bottom: 1px solid ${theme.border};
      }
    `}
    >
      <Label text="Activity" css="margin-top: 10px" />
      {Object.keys(issueEvents).length > 0 ? (
        Object.keys(issueEvents)
          .sort((a, b) => new Date(a) - new Date(b))
          .map((eventDate, i) => {
            return <IssueEvent key={i} {...issueEvents[eventDate]} />
          })
      ) : (
        <div css="padding: 6px 0 16px 16px">
          This issue has no activity
        </div>
      )}
    </div>
  )
}

EventsCard.propTypes = {
  issue: PropTypes.object.isRequired,
}

// eslint-disable-next-line import/no-unused-modules
export default EventsCard
