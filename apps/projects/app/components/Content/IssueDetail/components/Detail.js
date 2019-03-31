import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

import { Badge, Text, theme, ContextMenu, SafeLink, Button } from '@aragon/ui'
import { formatDistance } from 'date-fns'

import { IconGitHub, BountyContextMenu } from '../../../Shared'

const SummaryTable = ({ expLevel, deadline, slots, workStatus }) => {
  const FIELD_TITLES = [
    'Experience Level',
    'Deadline',
    'Slots Available',
    'Status',
  ]
  const mappedTableFields = [ expLevel, deadline, slots, workStatus ].map(
    (field, i) => (
      <StyledCell key={i}>
        <FieldTitle>{FIELD_TITLES[i]}</FieldTitle>
        <Text color={theme.textPrimary}>{field}</Text>
      </StyledCell>
    )
  )
  return <StyledTable>{mappedTableFields}</StyledTable>
}

const Wrapper = styled.div`
  display: flex;
  height: 100%;
  padding: 10px;
`
// todo: wrapper component for different sizes (changes padding mostly)

// ...that 10px margin result in a 20px gap
const cardStyle = {
  flex: '0 1 auto',
  textAlign: 'left',
  padding: '15px 30px',
  margin: '10px',
  background: theme.contentBackground,
  border: `1px solid ${theme.contentBorder}`,
  borderRadius: '3px',
}
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

const mockRequestsData = [{
  applicationDate: '2019-03-27T00:01:12.543Z',
  contributorAddr: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  eta: '2019-03-27T00:00:14.924Z',
  hours: '33',
  requestIPFSHash: 'QmSwBgEPqFjbWRfzXiSNPznQp3J9vqpmNPcqfvWRXHaqGT',
  status: 'Unreviewed',
  user: {
    id: 'MDQ6VXNlcjM0NDUyMTMx',
    login: 'rkzel',
    url: 'https://github.com/rkzel',
    avatarUrl: 'https://avatars0.githubusercontent.com/u/34452131?v=4'
  },
  workplan: 'the grand plan',
  review:{
    reviewDate: '2019-03-27T14:30:06.197Z',
    approved: true,
    feedback: 'feedback',
    user: {
      avatarUrl: 'https://avatars0.githubusercontent.com/u/34452131?v=4',
      id: 'MDQ6VXNlcjM0NDUyMTMx',
      login: 'rkzel',
      url: 'https://github.com/rkzel',
    },
  },
  approved: true,
}]
const mockWorkSubmissions = [{
  comments: 'comm',
  fulfillmentId: '0',
  hours: '3',
  proof: 'proof of work',
  review: {
    feedback: 'nope', rating: 2, accepted: false,
    user: { id: 'MDQ6VXNlcjM0NDUyMTMx', login: 'rkzel',
      url: 'https://github.com/rkzel',
      avatarUrl: 'https://avatars0.githubusercontent.com/u/34452131?v=4',
    }
  },
  status: '0',
  submissionDate: '2019-03-27T22:03:04.589Z',
  submissionIPFSHash: 'QmZ5N548rdGFn4nt8uLaXeahrZvanNW4FG4V9HmWv5iPni',
  submitter: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  user: {
    id: 'MDQ6VXNlcjM0NDUyMTMx',
    login: 'rkzel', url: 'https://github.com/rkzel',
    avatarUrl: 'https://avatars0.githubusercontent.com/u/34452131?v=4'
  },
}]

const IssueEventAvatar = styled.div`
width: 70px;
margin-right: 15px;
`
const IssueEventDetails = styled.div`
> margin-bottom: 10px;
`

const IssueEvent = props => (
  <div style={{ display: 'flex' }}>
    <IssueEventAvatar>
      <img src={props.avatarUrl} alt="user avatar" style={{ width: '66px' }} />
    </IssueEventAvatar>
    <IssueEventDetails>
      <Text.Block>
        <SafeLink
          href={props.url}
          target="_blank"
          style={{ textDecoration: 'none', color: '#21AAE7' }}
        >
          {props.login}
        </SafeLink> {props.eventDescription}
      </Text.Block>

      {props.eventMessage && (
        <div>
          {props.eventMessage}
        </div>
      )}
      {props.eventAction && (
        <div>
          {props.eventAction}
        </div>
      )}
      <Text.Block size="small" color={theme.textSecondary}>{calculateAgo(props.date)}</Text.Block>
    </IssueEventDetails>
  </div>
)

const calculateAgo = pastDate => {
  const date = Date.now()
  return formatDistance(pastDate, date, { addSuffix: true })
}

const activities = (requestsData, workSubmissions, onReviewApplication, onReviewWork) => {
  const events = []

  console.log('--activityRow:', requestsData)
  if (requestsData) {
    requestsData.forEach(data => {

      events[data.applicationDate] = {
        date: data.applicationDate,
        ...data.user,
        eventDescription: 'requested assignment',
        eventAction: ('review' in data) ?
          null
          :
          <Button mode="outline" onClick={onReviewApplication}>Review Application</Button>,
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
    workSubmissions.forEach(data => {

      events[data.submissionDate] = {
        date: data.submissionDate,
        ...data.user,
        eventDescription: 'submitted work for review',
        eventAction: ('review' in data) ?
          null
          :
          <Button mode="outline" onClick={onReviewWork}>Review Work</Button>,
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
              background={data.review.accepted ? '#e7f8ec' : '#f3c1c3' }
              foreground={data.review.accepted ? theme.positive : theme.negative}
            >Quality: {data.review.rating}</Badge>
            :
            <div>
              <Badge
                background={data.review.accepted ? '#e7f8ec' : '#f3c1c3' }
                foreground={data.review.accepted ? theme.positive : theme.negative}
              >Quality: {data.review.rating}</Badge>
              <Text>{data.review.feedback}</Text>
            </div>,
        }
      }
    })
  }
  return events
}

const deadlineDistance = date =>
  formatDistance(new Date(date), new Date())

const Detail = ({
  requestsData,
  url,
  balance,
  symbol,
  labels,
  title,
  number,
  repo,
  body,
  createdAt,
  expLevel,
  deadline,
  slots,
  work,
  workStatus,
  onReviewApplication,
  onReviewWork,
  onRequestAssignment,
  onSubmitWork,
  onAllocateSingleBounty,
  workSubmissions,
}) => {

  const summaryData = {
    expLevel: (expLevel === undefined) ? '-' : expLevel,
    deadline: (deadline === undefined) ? '-' : deadlineDistance(deadline) + ' remaining',
    slots: (slots === undefined) ? '-' :
      (requestsData === undefined) ? 'Unallocated (' + slots + ')' :
        (requestsData.length < slots) ? 'Slots available: ' + (slots - requestsData.length) + '/' + slots:
          'Allocated',
    workStatus: (workStatus === undefined) ? 'No bounty yet' : workStatus
  }

  //const issueEvents = activities(mockRequestsData, mockWorkSubmissions, onReviewApplication, onReviewWork)
  const issueEvents = activities(requestsData, workSubmissions, onReviewApplication, onReviewWork)

  return (
    <Wrapper>
      <div style={{ flex: 3, maxWidth: '705px' }}>
        <DetailsCard>
          <Wrapper style={{ justifyContent: 'space-between' }}>
            <div style={{ ...column, flex: 2, marginRight: '20px' }}>
              <Text.Block size="xlarge" style={{ marginBottom: '5px' }}>
                {title}
              </Text.Block>
              <SafeLink
                href={url}
                target="_blank"
                style={{ textDecoration: 'none', color: '#21AAE7' }}
              >
                <IssueLinkRow>
                  <IconGitHub color="#21AAE7" width='14px' height='14px' />
                  <Text style={{ marginLeft: '6px' }}>{repo} #{number}</Text>
                </IssueLinkRow>
              </SafeLink>
              <Text.Block
                size="small"
                color={theme.textSecondary}
                style={{ marginBottom: '10px' }}
              >
                {calculateAgo(createdAt)}
              </Text.Block>
            </div>
            <div style={{ ...column, flex: 0, alignItems: 'flex-end' }}>
              <ContextMenu>
                <BountyContextMenu
                  work={work}
                  workStatus={workStatus}
                  requestsData={requestsData}
                  onAllocateSingleBounty={onAllocateSingleBounty}
                  onSubmitWork={onSubmitWork}
                  onRequestAssignment={onRequestAssignment}
                  onReviewApplication={onReviewApplication}
                  onReviewWork={onReviewWork}
                />
              </ContextMenu>
              { balance > 0 &&
                <Badge
                  style={{ padding: '10px', textSize: 'large', marginTop: '15px' }}
                  background={'#e7f8ec'}
                  foreground={theme.positive}
                >
                  {balance + ' ' + symbol}
                </Badge>
              }
            </div>
          </Wrapper>
          <SummaryTable {...summaryData} />
          <FieldTitle>Description</FieldTitle>
          <Text.Block style={{ marginTop: '20px', marginBottom: '20px' }}>
            {body ? body : 'No description available'}
          </Text.Block>
          <Text size="small" color={theme.textTertiary}>
            {labels.totalCount
              ? labels.edges.map(label => (
                <Badge
                  key={label.node.id}
                  style={{ marginRight: '5px' }}
                  background={'#' + label.node.color}
                  foreground={'#000'}
                >
                  {label.node.name}
                </Badge>
              ))
              : ''}
          </Text>
        </DetailsCard>
      </div>

      <div style={{ flex: 1, maxWidth: '359px', width: '295px' }}>
        <DetailsCard>
          <FieldTitle>Activity</FieldTitle>
          {Object.keys(issueEvents).sort((a,b) =>
            new Date(a) - new Date(b)
          ).map((eventDate, i) => {
            return <IssueEvent key={i} {...issueEvents[eventDate]} />
          }
          )}
        </DetailsCard>
      </div>

    </Wrapper>
  )
}
const DetailsCard = styled.div`
flex: 0 1 auto;
text-align: left;
padding: 15px 30px;
margin: 10px;
background: ${theme.contentBackground};
border: 1px solid ${theme.contentBorder};
border-radius: 3px;
`
const StyledTable = styled.div`
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
const ActionLabel = styled.span`
  margin-left: 15px;
`
Detail.propTypes = {
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
}

export default Detail
