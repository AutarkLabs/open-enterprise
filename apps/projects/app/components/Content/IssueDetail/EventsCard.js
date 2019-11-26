import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import {
  Box,
  Tag,
  Text,
  useTheme,
  GU,
  Link,
  Button,
} from '@aragon/ui'
import { formatDistance } from 'date-fns'
import { usePanelManagement } from '../../Panel'
import { issueShape, userGitHubShape } from '../../../utils/shapes.js'
import workRatings from '../../../utils/work-ratings.js'

const calculateAgo = pastDate => formatDistance(pastDate, Date.now(), { addSuffix: true })

const IssueEvent = ({ user, ...props }) => {
  const theme = useTheme()

  return (
    <IssueEventMain>
      <div css="display: flex">
        <IssueEventAvatar>
          <img src={user.avatarUrl} alt="user avatar" css="width: 40px; border-radius: 50%" />
        </IssueEventAvatar>
        <IssueEventDetails>
          <Text.Block size="small">
            <Link
              href={user.url}
              target="_blank"
              style={{ textDecoration: 'none', color: `${theme.link}` }}
            >
              {user.login}
            </Link>{' '}
            {props.eventDescription}
          </Text.Block>
          <Text.Block size="xsmall" color={`${theme.surfaceContentSecondary}`}>
            {calculateAgo(props.date)}
          </Text.Block>
        </IssueEventDetails>
      </div>
      {props.eventAction && (
        <div css="margin-top: 8px">
          {props.eventAction}
        </div>
      )}
    </IssueEventMain>
  )
}

IssueEvent.propTypes = {
  user: userGitHubShape,
  eventDescription: PropTypes.string.isRequired,
  eventAction: PropTypes.object,
  date: PropTypes.string.isRequired,
}

const activities = (
  issue,
  createdAt,
  requestsData,
  workSubmissions,
  fundingHistory,
  onReviewApplication,
  onReviewWork
) => {
  const theme = useTheme()
  const events = {
    createdAt: {
      date: createdAt,
      user: issue.author,
      eventDescription: 'opened the task'
    }
  }

  if (requestsData) {
    requestsData.forEach((data, index) => {
      events[data.applicationDate] = {
        date: data.applicationDate,
        user: data.user,
        eventDescription: 'requested assignment',
        eventAction: (
          <EventButton
            mode="normal"
            onClick={() => onReviewApplication(issue, index)}
            wide
          >
            <Text weight="bold">
              View application
            </Text>
          </EventButton>
        ),
      }

      if ('review' in data) {
        events[data.review.reviewDate] = {
          date: data.review.reviewDate,
          user: data.review.user,
          eventDescription: (data.review.approved ? 'assigned' : 'rejected') + ' ' + data.user.login,
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
        user: data.user,
        eventDescription: 'submitted work for review',
        eventAction: (
          <EventButton
            mode="normal"
            onClick={() => onReviewWork(issue, index)}
            wide
          >
            <Text weight="bold">
              View work
            </Text>
          </EventButton>
        ),
      }

      if ('review' in data) {
        events[data.review.reviewDate] = {
          date: data.review.reviewDate,
          user: data.review.user,
          eventDescription: (data.review.accepted ? 'accepted' : 'rejected') + ' ' + data.user.login + '\'s work',
          eventAction:
            <div>
              {!!data.review.feedback.length && (
                <Text.Block size="large" style={{ marginBottom: '8px' }}>
                  {data.review.feedback}
                </Text.Block>
              )}
              <Tag
                uppercase={false}
                color={`${theme.surfaceContentSecondary}`}
                background={`${theme.border}`}
              >
                {'Quality:' + ' ' + workRatings[data.review.rating]}
              </Tag>
            </div>
        }
      }
    })
  }

  if (fundingHistory) {
    fundingHistory.forEach((data, i) => {
      events[data.date] = {
        date: data.date,
        user: data.user,
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
    issue.createdAt,
    issue.requestsData,
    issue.workSubmissions,
    issue.fundingHistory,
    reviewApplication,
    reviewWork
  )

  return (
    <Box
      heading="Activity"
      padding={0}
      css={`
        > :first-child {
          padding: ${2 * GU}px;
        }
      `}
    >
      <div css={`
        > :not(:last-child) {
          border-bottom: 1px solid ${theme.border};
        }
      `}>
        {Object.keys(issueEvents).length > 0 ? (
          Object.keys(issueEvents)
            .sort((a, b) => new Date(a) - new Date(b))
            .map((eventDate, i) => {
              return <IssueEvent key={i} user={issueEvents[eventDate].user} {...issueEvents[eventDate]} />
            })
        ) : (
          <IssueEventMain>
              This issue has no activity
          </IssueEventMain>
        )
        }
      </div>
    </Box>
  )
}

EventsCard.propTypes = {
  issue: issueShape,
}

const IssueEventAvatar = styled.div`
  width: 40px;
  margin-right: ${GU}px;
`
const IssueEventMain = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${3 * GU}px;
`
const IssueEventDetails = styled.div`
  > :not(:last-child) {
    margin-bottom: ${GU}px;
  }
`
const EventButton = styled(Button)`
  padding: 5px 20px 2px 20px;
  font-size: 15px;
  border-radius: 5px;
`

// eslint-disable-next-line import/no-unused-modules
export default EventsCard
