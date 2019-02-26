import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import {
  Badge,
  Text,
  theme,
  ContextMenu,
  ContextMenuItem,
  SafeLink,
} from '@aragon/ui'
import { format, formatDistance } from 'date-fns'

import { DropDownButton } from '../../../Shared'
import { IconGitHub, BountyContextMenu } from '../../../Shared'

const StyledTable = styled.div`
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: solid ${theme.contentBorder};
  border-width: 2px 0;
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
const SummaryTable = ({ expLevel, deadline, slots, workStatus }) => {
  const FIELD_TITLES = [
    'Experience Level',
    'Deadline',
    'Slots Available',
    'Status',
  ]
  const mappedTableFields = [expLevel, deadline, slots, workStatus].map(
    (field, i) => (
      <StyledCell key={i}>
        <FieldTitle>{FIELD_TITLES[i]}</FieldTitle>
        <Text color={theme.textPrimary}>{field}</Text>
      </StyledCell>
    )
  )
  return <StyledTable>{mappedTableFields}</StyledTable>
}

// this 10px padding and...
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

const column = {
  display: 'flex',
  flexDirection: 'column',
  flexBasis: '100%',
}

// TODO: Remove fake default value for img
const Avatar = ({ size, img }) => {
  // do something with the size...
  const avatarStyle = () => {
    switch (size) {
    case 'small':
      return { transform: 'scale(.6)' }
    default:
      return { transform: 'scale(.8)' }
    }
  }

  return (
    <div>
      <img src={img} alt="user avatar" style={avatarStyle()} />
    </div>
  )
}

const MemberRow = ({ name, role, status, avatar }) => (
  <Wrapper>
    <Avatar size="normal" style={column}>
      {avatar}
    </Avatar>
    <div style={{ ...column, flex: 2 }}>
      <Text.Block>{name}</Text.Block>
      <Text.Block>{role}</Text.Block>
      <Text.Block>{status}</Text.Block>
    </div>
    <ContextMenu>
      <ContextMenuItem>In progress...</ContextMenuItem>
    </ContextMenu>
  </Wrapper>
)

const ActivityRow = ({ name, log, login, date, avatar, url }) => (
  <React.Fragment>
    <UserLink>
      <img
        src={avatar}
        style={{ width: '49px', height: '49px', marginRight: '10px' }}
      />
      <div>
        <SafeLink
          href={url}
          target="_blank"
          style={{
            textDecoration: 'none',
            color: '#21AAE7',
            marginRight: '6px',
          }}
        >
          {name ? name : login}
        </SafeLink>
        {log}
        <Text.Block color={theme.textSecondary} size="small">
          {date}
        </Text.Block>
      </div>
    </UserLink>

    <Separator />
  </React.Fragment>
)

const UserLink = styled.div`
  display: flex;
  align-items: center;
`

const Separator = styled.hr`
  height: 1px;
  width: 100%;
  color: #d1d1d1;
  opacity: 0.1;
`

const fakeMembers = [
  {
    name: 'Worf',
    role: 'Contributor',
    status: 'Pending assignment',
    avatar: null,
  },
  {
    name: 'Tasha Yar',
    role: 'Contributor',
    status: 'Assignment approved',
    avatar: null,
  },
  {
    name: 'Data',
    role: 'Task Manager',
    status: 'Last seen 4 hours ago',
    avatar: null,
  },
]

const Detail = ({
  requestsData,
  balance,
  symbol,
  labels,
  title,
  number,
  repo,
  body,
  createdAt,
  team = fakeMembers, // TODO: Also this
  expLevel,
  deadline,
  slots,
  workStatus,
  onReviewApplication,
  onReviewWork,
  onRequestAssignment,
  onSubmitWork,
  onAllocateSingleBounty,
}) => {
  //console.log('Detail props:', requestsData, balance, symbol, labels, title, number, repo, body, createdAt, expLevel, deadline, slots, workStatus)

  const summaryData = {
    expLevel: expLevel === undefined ? '-' : expLevel,
    deadline:
      deadline === undefined ? '-' : format(deadline, 'yyyy-MM-dd HH:mm:ss'),
    slots:
      slots === undefined
        ? '-'
        : requestsData === undefined
          ? 'Unallocated (' + slots + ')'
          : requestsData.length < slots
            ? 'Slots available: ' + (slots - requestsData.length) + '/' + slots
            : 'Allocated',
    workStatus: workStatus === undefined ? 'No bounty yet' : workStatus,
  }
  const calculatedDate = () => {
    const date = Date.now()
    return formatDistance(createdAt, date, { addSuffix: true })
  }
  // Some dynamically generated components
  const teamRows = team.map((member, i) => <MemberRow key={i} {...member} />)
  const activityData =
    requestsData &&
    requestsData.map((r, i) => {
      const applicationDateDistance = formatDistance(
        new Date(r.applicationDate),
        new Date()
      )
      const activity = {
        name: r.user.login,
        log: 'requested assignment',
        date: `${applicationDateDistance} ago`,
        avatar: r.user.avatarUrl,
      }
      return activity
    })
  const activityRows = activityData
    ? activityData.map((a, i) => <ActivityRow key={i} {...a} />)
    : null

  return (
    <Wrapper>
      <div style={{ flex: 3, maxWidth: '705px' }}>
        <div style={cardStyle}>
          <Wrapper style={{ justifyContent: 'space-between' }}>
            <div style={{ ...column, flex: 2, marginRight: '20px' }}>
              <Text.Block size="xlarge" style={{ marginBottom: '10px' }}>
                {title}
              </Text.Block>
              <Text.Block color="#21AAE7" style={{ marginBottom: '10px' }}>
                <IconGitHub color="#21AAE7" width="14px" height="14px" />
                <span style={{ marginLeft: '5px ' }}>
                  {repo} #{number}
                </span>
              </Text.Block>
              <Text.Block
                size="small"
                color={theme.textSecondary}
                style={{ marginBottom: '10px' }}
              >
                {calculatedDate()}
              </Text.Block>
            </div>
            <div style={{ ...column, flex: 0, alignItems: 'flex-end' }}>
              <DropDownButton enabled>
                <BountyContextMenu
                  workStatus={workStatus}
                  requestsData={requestsData}
                  onAllocateSingleBounty={onAllocateSingleBounty}
                  onSubmitWork={onSubmitWork}
                  onRequestAssignment={onRequestAssignment}
                  onReviewApplication={onReviewApplication}
                  onReviewWork={onReviewWork}
                />
              </DropDownButton>
              {balance > 0 && (
                <Badge
                  style={{
                    padding: '10px',
                    marginRight: '20px',
                    textSize: 'large',
                    marginTop: '15px',
                  }}
                  background={'#e7f8ec'}
                  foreground={theme.positive}
                >
                  {balance + ' ' + symbol}
                </Badge>
              )}
            </div>
          </Wrapper>
          <SummaryTable {...summaryData} />
          <FieldTitle>Description</FieldTitle>
          <Text.Block style={{ marginTop: '20px', marginBottom: '20px' }}>
            {body}
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
        </div>
      </div>
      {/* Activity and team not currently fully implemented */}
      <div style={{ flex: 1, maxWidth: '359px' }}>
        {/* <div style={cardStyle}>
            <FieldTitle>Team</FieldTitle>
            {teamRows}
        </div> */}
        <div style={cardStyle}>
          <FieldTitle>Activity</FieldTitle>
          {activityRows}
        </div>
      </div>
    </Wrapper>
  )
}

export default Detail
