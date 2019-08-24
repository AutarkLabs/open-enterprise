import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import {
  Badge,
  Text,
  theme,
  ContextMenu,
  SafeLink,
  Button,
  Viewport,
  breakpoint,
} from '@aragon/ui'
import { formatDistance } from 'date-fns'
import { IconGitHub, BountyContextMenu } from '../../Shared'
import { BOUNTY_STATUS, BOUNTY_BADGE_COLOR } from '../../../utils/bounty-status'
import { Markdown } from '../../../../../../shared/ui'
import { usePanelManagement } from '../../Panel'

const StyledTable = styled.div`
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border: solid ${theme.contentBorder};
  border-width: 1px 0;
  > :not(:first-child) {
    border-left: 1px solid ${theme.contentBorder};
    padding-left: 15px;
  }
`

const StyledCell = styled.div`
  padding: 20px 0;
  align-items: left;
`

// TODO: shared
const FieldTitle = styled(Text.Block)`
  color: ${theme.textSecondary};
  text-transform: lowercase;
  font-variant: small-caps;
  font-weight: bold;
  margin-bottom: 6px;
`

const determineFieldText = (fieldTitle, fieldText, balance) => {
  const isStatusField = fieldTitle.toLowerCase() === 'status'
  const isFulfilled = isStatusField && Number(balance) === 0
  if (isFulfilled) return BOUNTY_STATUS['fulfilled']
  else if (isStatusField) return BOUNTY_STATUS[fieldText]
  return fieldText
}

const SummaryTable = ({ expLevel, deadline, workStatus, balance }) => {
  const FIELD_TITLES = [ 'Experience Level', 'Deadline', 'Status' ]
  const mappedTableFields = [ expLevel, deadline, workStatus ].map((field, i) => (
    <StyledCell key={i}>
      <FieldTitle>{FIELD_TITLES[i]}</FieldTitle>
      <Text color={theme.textPrimary}>
        {determineFieldText(FIELD_TITLES[i], field, balance)}
      </Text>
    </StyledCell>
  ))
  return <StyledTable>{mappedTableFields}</StyledTable>
}

SummaryTable.propTypes = {
  expLevel: PropTypes.string.isRequired,
  deadline: PropTypes.string.isRequired,
  workStatus: PropTypes.string.isRequired,
  balance: PropTypes.string.isRequired,
}

const Wrapper = styled.div`
  display: flex;
  padding-top: 10px;
`

const IssueLinkRow = styled.div`
  height: 31px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`

const column = {
  display: 'flex',
  flexDirection: 'column',
  flexBasis: '100%',
}

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

const IssueEvent = props => (
  <IssueEventMain>
    <IssueEventAvatar>
      <img src={props.avatarUrl} alt="user avatar" style={{ width: '50px' }} />
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
      <Text.Block size="xsmall" color={theme.textSecondary}>
        {calculateAgo(props.date)}
      </Text.Block>
    </IssueEventDetails>
  </IssueEventMain>
)

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
                foreground={theme.textSecondary}
                background={theme.contentBorder}
              >
                Quality: {data.review.rating}
              </Badge>
            ) : (
              <div>
                <Text.Block size="large" style={{ marginBottom: '8px' }}>
                  {data.review.feedback}
                </Text.Block>
                <Badge
                  foreground={theme.textSecondary}
                  background={theme.contentBorder}
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

const deadlineDistance = date => formatDistance(new Date(date), new Date())

const DetailsCard = ({ issue }) => {
  const summaryData = {
    expLevel: issue.expLevel === undefined ? '-' : issue.expLevel,
    deadline:
      issue.deadline === undefined
        ? '-'
        : deadlineDistance(issue.deadline) + ' remaining',
    workStatus:
      issue.workStatus === undefined ? 'No bounty yet' : issue.workStatus,
    balance: issue.balance,
  }

  return (
    <StyledDetailsCard>
      <Wrapper style={{ justifyContent: 'space-between' }}>
        <div style={{ ...column, flex: 2, marginRight: '20px' }}>
          <Text.Block size="xlarge" style={{ marginBottom: '5px' }}>
            {issue.title}
          </Text.Block>
          <SafeLink
            href={issue.url}
            target="_blank"
            style={{ textDecoration: 'none', color: '#21AAE7' }}
          >
            <IssueLinkRow>
              <IconGitHub color="#21AAE7" width="14px" height="14px" />
              <Text style={{ marginLeft: '6px' }}>
                {issue.repo} #{issue.number}
              </Text>
            </IssueLinkRow>
          </SafeLink>
          <Text.Block
            size="small"
            color={theme.textSecondary}
            style={{ marginBottom: '10px' }}
          >
            {calculateAgo(issue.createdAt)}
          </Text.Block>
        </div>
        <div style={{ ...column, flex: 0, alignItems: 'flex-end' }}>
          <ContextMenu>
            <BountyContextMenu issue={issue} />
          </ContextMenu>
          {issue.balance > 0 && (
            <Badge
              style={{ padding: '10px', textSize: 'large', marginTop: '15px' }}
              background={BOUNTY_BADGE_COLOR[issue.workStatus].bg}
              foreground={BOUNTY_BADGE_COLOR[issue.workStatus].fg}
            >
              {issue.balance + ' ' + issue.symbol}
            </Badge>
          )}
        </div>
      </Wrapper>
      {issue.workStatus ? <SummaryTable {...summaryData} /> : <Separator />}
      <FieldTitle>Description</FieldTitle>
      <Markdown
        content={issue.body || 'No description available'}
        style={{ marginTop: '20px', marginBottom: '20px' }}
      />
      <Text size="small" color={theme.textTertiary}>
        {issue.labels.totalCount
          ? issue.labels.edges.map(label => (
            <Badge
              key={label.node.id}
              style={{ marginRight: '5px' }}
              background={'#' + label.node.color + '99'}
              foreground={'#000'}
            >
              {label.node.name}
            </Badge>
          ))
          : ''}
      </Text>
    </StyledDetailsCard>
  )
}

DetailsCard.propTypes = {
  issue: PropTypes.object.isRequired,
}

const EventsCard = ({ issue }) => {
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
    <StyledEventsCard>
      <FieldTitle>Activity</FieldTitle>
      {Object.keys(issueEvents).length > 0 ? (
        Object.keys(issueEvents)
          .sort((a, b) => new Date(a) - new Date(b))
          .map((eventDate, i) => {
            return <IssueEvent key={i} {...issueEvents[eventDate]} />
          })
      ) : (
        <div style={{ padding: '6px 0 16px 16px' }}>
          This issue has no activity
        </div>
      )}
    </StyledEventsCard>
  )
}

EventsCard.propTypes = {
  issue: PropTypes.object.isRequired,
}

const IssueDetail = ({ issue }) => {
  return (
    <Viewport>
      {({ below }) =>
        below('medium') ? (
          <CardWrapper style={{ flexDirection: 'column' }}>
            <div
              style={{
                minWidth: '330px',
                width: '100%',
                marginBottom: below('small') ? '0.2rem' : '2rem',
              }}
            >
              <DetailsCard issue={issue} />
            </div>
            <div style={{ minWidth: '330px', width: '100%' }}>
              <EventsCard issue={issue} />
            </div>
          </CardWrapper>
        ) : (
          <CardWrapper style={{ flexDirection: 'row' }}>
            <div
              style={{
                maxWidth: '705px',
                minWidth: '350px',
                width: '70%',
                marginRight: '2rem',
              }}
            >
              <DetailsCard issue={issue} />
            </div>
            <div style={{ maxWidth: '400px', minWidth: '350px', width: '30%' }}>
              <EventsCard issue={issue} />
            </div>
          </CardWrapper>
        )
      }
    </Viewport>
  )
}

IssueDetail.propTypes = {
  issue: PropTypes.shape({
    workStatus: PropTypes.oneOf([
      undefined,
      'funded',
      'review-applicants',
      'in-progress',
      'review-work',
      'fulfilled',
    ]),
    work: PropTypes.oneOf([ undefined, PropTypes.object ]),
    fundingHistory: PropTypes.array,
  }).isRequired,
}

const CardWrapper = styled.div`
  display: flex;
  ${breakpoint(
    'small',
    `
    padding: 1.5rem 3rem;
    `
  )};
  padding: 0.2rem;
`
const StyledDetailsCard = styled.div`
  flex: 0 1 auto;
  text-align: left;
  padding: 15px 30px;
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
`

const StyledEventsCard = styled(StyledDetailsCard)`
  padding: 0 10px;
  > * {
    padding: 16px 0 6px 16px;
  }
  > :not(:last-child) {
    margin-bottom: 0;
  }
  > :not(:last-child) :not(:first-child) {
    border-bottom: 1px solid ${theme.contentBorder};
  }
`

const Separator = styled.hr`
  height: 1px;
  width: 100%;
  opacity: 0.2;
`

// eslint-disable-next-line import/no-unused-modules
export default IssueDetail
