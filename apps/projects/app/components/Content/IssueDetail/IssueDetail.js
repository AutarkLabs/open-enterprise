import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Badge, Text, theme, ContextMenu, SafeLink, Button, Viewport, breakpoint } from '@aragon/ui'
import { formatDistance } from 'date-fns'
import marked from 'marked'
import renderHTML from 'react-render-html'
import { IconGitHub, BountyContextMenu } from '../../Shared'
import { BOUNTY_STATUS, BOUNTY_BADGE_COLOR } from '../../../utils/bounty-status'

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
  const FIELD_TITLES = [
    'Experience Level',
    'Deadline',
    'Status',
  ]
  const mappedTableFields = [ expLevel, deadline, workStatus ].map(
    (field, i) => (
      <StyledCell key={i}>
        <FieldTitle>{FIELD_TITLES[i]}</FieldTitle>
        <Text color={theme.textPrimary}>
          {determineFieldText(FIELD_TITLES[i], field, balance)}
        </Text>
      </StyledCell>
    )
  )
  return <StyledTable>{mappedTableFields}</StyledTable>
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
        </SafeLink> {props.eventDescription}
      </Text.Block>

      {props.eventMessage && (
        <Text.Block size="large">
          {props.eventMessage}
        </Text.Block>
      )}
      {props.eventAction && (
        <div>
          {props.eventAction}
        </div>
      )}
      <Text.Block size="xsmall" color={theme.textSecondary}>{calculateAgo(props.date)}</Text.Block>
    </IssueEventDetails>
  </IssueEventMain>
)

const calculateAgo = pastDate => {
  const date = Date.now()
  return formatDistance(pastDate, date, { addSuffix: true })
}

const activities = (issue, requestsData, workSubmissions, fundingHistory, onReviewApplication, onReviewWork) => {
  const events = []

  if (requestsData) {
    requestsData.forEach((data, index) => {

      events[data.applicationDate] = {
        date: data.applicationDate,
        ...data.user,
        eventDescription: 'requested assignment',
        eventAction: (
          <EventButton mode="outline" onClick={() => onReviewApplication(issue, index)}>
            {('review' in data) ? 'View' : 'Review'} Application
          </EventButton>
        ),
      }

      if ('review' in data) {
        events[data.review.reviewDate] = {
          date: data.review.reviewDate,
          ...data.review.user,
          eventDescription: data.review.approved ? 'assigned ' + data.user.login : 'rejected ' + data.user.login,
          eventAction: data.review.feedback.length === 0 ?
            null
            :
            <Text>{data.review.feedback}</Text>
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
          <EventButton mode="outline" onClick={() => onReviewWork(issue, index)}>
            {('review' in data) ? 'View' : 'Review'} Work
          </EventButton>
        ),
      }

      if ('review' in data) {
        events[data.review.reviewDate] = {
          date: data.review.reviewDate,
          ...data.review.user,
          eventDescription: data.review.accepted ?
            'accepted ' + data.user.login + '\'s work'
            :
            'rejected ' + data.user.login + '\'s work',
          eventAction: data.review.feedback.length === 0 ?
            <Badge
              foreground={theme.textSecondary}
              background={theme.contentBorder}
            >Quality: {data.review.rating}</Badge>
            :
            <div>
              <Text.Block size="large" style={{ marginBottom: '8px' }}>
                {data.review.feedback}
              </Text.Block>
              <Badge
                foreground={theme.textSecondary}
                background={theme.contentBorder}
              >Quality: {data.review.rating}</Badge>
            </div>,
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

const deadlineDistance = date =>
  formatDistance(new Date(date), new Date())

const detailsCard = ({
  issue,
  onReviewApplication,
  onReviewWork,
  onUpdateBounty,
  onRequestAssignment,
  onSubmitWork,
  onAllocateSingleBounty,
}) => {
  const summaryData = {
    expLevel: (issue.expLevel === undefined) ? '-' : issue.expLevel,
    deadline: (issue.deadline === undefined) ? '-' : deadlineDistance(issue.deadline) + ' remaining',
    workStatus: (issue.workStatus === undefined) ? 'No bounty yet' : issue.workStatus,
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
              <IconGitHub color="#21AAE7" width='14px' height='14px' />
              <Text style={{ marginLeft: '6px' }}>{issue.repo} #{issue.number}</Text>
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
          {issue.workStatus !== 'fulfilled' && (
            <ContextMenu>
              <BountyContextMenu
                work={issue.work}
                workStatus={issue.workStatus}
                requestsData={issue.requestsData}
                onUpdateBounty={() => onUpdateBounty(issue)}
                onAllocateSingleBounty={() => onAllocateSingleBounty(issue)}
                onSubmitWork={() => onSubmitWork(issue)}
                onRequestAssignment={() => onRequestAssignment(issue)}
                onReviewApplication={() => onReviewApplication(issue)}
                onReviewWork={() => onReviewWork(issue)}
              />
            </ContextMenu>
          )}
          {issue.balance > 0 &&
            <Badge
              style={{ padding: '10px', textSize: 'large', marginTop: '15px' }}
              background={BOUNTY_BADGE_COLOR[issue.workStatus].bg}
              foreground={BOUNTY_BADGE_COLOR[issue.workStatus].fg}
            >
              {issue.balance + ' ' + issue.symbol}
            </Badge>
          }
        </div>
      </Wrapper>
      {issue.workStatus ? <SummaryTable {...summaryData} /> : <Separator />}
      <FieldTitle>Description</FieldTitle>
      <Text.Block style={{ marginTop: '20px', marginBottom: '20px' }}>
        <MarkdownWrapper>
          {issue.body ? renderHTML(marked(issue.body)) : 'No description available'}
        </MarkdownWrapper>
      </Text.Block>
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

const eventsCard = ({ issue, onReviewApplication, onReviewWork }) => {
  const issueEvents = activities(
    issue,
    issue.requestsData,
    issue.workSubmissions,
    issue.fundingHistory,
    onReviewApplication,
    onReviewWork
  )

  return (
    <StyledEventsCard>
      <FieldTitle>Activity</FieldTitle>
      {Object.keys(issueEvents).length > 0
        ? Object.keys(issueEvents).sort((a, b) =>
          new Date(a) - new Date(b)
        ).map((eventDate, i) => {
          return <IssueEvent key={i} {...issueEvents[eventDate]} />
        })
        :
        <div style={{ padding: '6px 0 16px 16px' }}>
          This issue has no activity
        </div>
      }
    </StyledEventsCard>
  )
}

const IssueDetail = issue => {
  return (
    <Viewport>
      {({ below }) => below('medium') ? (
        <CardWrapper style={{ flexDirection: 'column' }}>
          <div style={{ minWidth: '330px', width: '100%', marginBottom: below('small') ? '0.2rem' : '2rem' }}>
            {detailsCard(issue)}
          </div>
          <div style={{ minWidth: '330px', width: '100%' }}>
            {eventsCard(issue)}
          </div>
        </CardWrapper>
      ) : (
        <CardWrapper style={{ flexDirection: 'row' }}>
          <div style={{ maxWidth: '705px', minWidth: '350px', width: '70%', marginRight: '2rem' }}>
            {detailsCard(issue)}
          </div>
          <div style={{ maxWidth: '400px', minWidth: '350px', width: '30%' }}>
            {eventsCard(issue)}
          </div>
        </CardWrapper>
      )}
    </Viewport>
  )
}

IssueDetail.propTypes = {
  onAllocateSingleBounty: PropTypes.func.isRequired,
  onSubmitWork: PropTypes.func.isRequired,
  onRequestAssignment: PropTypes.func.isRequired,
  onReviewApplication: PropTypes.func.isRequired,
  onReviewWork: PropTypes.func.isRequired,
  workStatus: PropTypes.oneOf([ undefined, 'funded', 'review-applicants', 'in-progress', 'review-work', 'fulfilled' ]),
  work: PropTypes.oneOf([
    undefined,
    PropTypes.object,
  ]),
  fundingHistory: PropTypes.array,
}

const CardWrapper = styled.div`
  display: flex;
  ${breakpoint(
    'small',
    `
    padding: 1.5rem 3rem;
    `)
};
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
const MarkdownWrapper = styled.div`
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: 700;
    line-height: 1;
    cursor: text;
    position: relative;
    margin: 1em 0 15px;
    padding: 0;
  }
  h1 {
    font-size: 2.5em;
    border-bottom: 1px solid ${theme.contentBorder};
  }
  h2 {
    font-size: 2em;
    border-bottom: 1px solid ${theme.contentBorder};
  }
  h3 {
    font-size: 1.55em;
  }
  h4 {
    font-size: 1.2em;
  }
  h5 {
    font-size: 1em;
  }
  h6 {
    color: ${theme.textSecondary};
    font-size: 1em;
  }
  p,
  blockquote,
  table,
  pre {
    margin: 3px 0;
  }
  blockquote {
    padding: 0 15px;
    border-left: 4px solid ${theme.textTertiary};
    color: ${theme.textTertiary};
  }
  blockquote > :first-child {
    margin-top: 0;
  }
  blockquote > :last-child {
    margin-bottom: 10px;
  }

  a {
    color: ${theme.gradientStart};
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  a > code,
  p > code {
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px;
    padding: 0.2em 0.4em;
  }
  table {
    border-collapse: collapse;
  }
  tr {
    border-top: 1px solid ${theme.contentBorder};
  }
  tr:nth-child(2n) {
    background-color: #f8f8f8;
  }
  th,
  td {
    border: 1px solid ${theme.contentBorder};
    padding: 6px 13px;
  }
  img {
    max-width: 95%;
  }
  pre {
    margin: 0;
    background-color: ${theme.mainBackground};
    border-radius: 3px;
    overflow: auto;
    padding: 16px;
  }
  ul {
    padding-left: 30px;
  }
  li:last-of-type {
    padding-bottom: 1rem;
  }
  ol {
    padding-left: 30px;
    padding-bottom: 1rem;
  }
  ol li ul:first-of-type {
    margin-top: 0;
  }
`

const Separator = styled.hr`
  height: 1px;
  width: 100%;
  opacity: 0.2;
`

export default IssueDetail
