import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import {
  Text,
  theme,
  Badge,
  Checkbox,
  ContextMenu,
  ContextMenuItem,
} from '@aragon/ui'

import { formatDistance } from 'date-fns'
import { BountyContextMenu } from '../Shared'
import { BOUNTY_STATUS, BOUNTY_BADGE_COLOR } from '../../utils/bounty-status'

const ClickArea = styled.div`
  height: 100%;
  left: 0;
  position: absolute;
  width: 100%;
  z-index: 0;
  :active {
    border: 1px solid ${theme.accent};
    z-index: 3;
  }
  :hover {
    cursor: pointer;
  }
`
const DeadlineDistance = date =>
  formatDistance(new Date(date), new Date(), { addSuffix: true })

const dot = <span style={{ margin: '0px 6px' }}>&middot;</span>

const labelsBadges = labels =>
  labels.edges.map(label => (
    <Badge
      key={label.node.id}
      style={{ marginRight: '10px' }}
      background={'#' + label.node.color}
      foreground={'#000'}
    >
      {label.node.name}
    </Badge>
  ))

const Issue = ({
  work,
  workStatus,
  title,
  repo,
  number,
  labels,
  isSelected,
  onSelect,
  onClick,
  onSubmitWork,
  onRequestAssignment,
  onReviewApplication,
  onAllocateSingleBounty,
  onUpdateBounty,
  onReviewWork,
  balance,
  symbol,
  deadline,
  requestsData,
  bountySettings,
  expLevel,
  slots,
}) => {
  //console.log('CARD:', workStatus, title, repo, number, labels, isSelected, balance, symbol, deadline, requestsData, expLevel, slots)

  // prepare display of number of slots vs number of applicants
  const slotsAllocation =
    requestsData === undefined
      ? 'Unallocated (' + slots + ')'
      : requestsData.length < slots
        ? 'Slots available: ' + (slots - requestsData.length) + '/' + slots
        : 'Allocated'

  return (
    <StyledIssue>
      <ClickArea onClick={onClick} />
      <Checkbox checked={isSelected} onChange={onSelect} />
      <IssueDesc>
        <div>
          <Text color={theme.textPrimary} size="large">
            {title}
          </Text>
          {dot}
          <Text color={theme.textSecondary} size="normal">
            {repo} #{number}
          </Text>
        </div>
        {(BOUNTY_STATUS[workStatus]) && (
          <IssueDetails>
            <Text size="small" color={theme.textTertiary}>
              <span style={{ marginRight: '15px' }}>
                {expLevel}
                {dot}
                {balance > 0 ? BOUNTY_STATUS[workStatus] : BOUNTY_STATUS['fulfilled']}
                {dot}
                  Due {DeadlineDistance(deadline)}
              </span>
              {labels.totalCount ? labelsBadges(labels) : ''}
            </Text>
          </IssueDetails>
        )}
      </IssueDesc>
      <BalanceAndContext>
        {balance > 0 && (
          <Badge
            style={{ padding: '10px', marginRight: '20px', textSize: 'large' }}
            background={BOUNTY_BADGE_COLOR[workStatus].bg}
            foreground={BOUNTY_BADGE_COLOR[workStatus].fg}
          >
            {balance + ' ' + symbol}
          </Badge>
        )}
        {workStatus !== 'fulfilled' && (
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
              onUpdateBounty={onUpdateBounty}
            />
          </ContextMenu>
        )}
      </BalanceAndContext>
    </StyledIssue>
  )
}

Issue.propTypes = {
  title: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  number: PropTypes.number.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  workStatus: PropTypes.oneOf([ undefined, 'funded', 'review-applicants', 'in-progress', 'review-work', 'fulfilled' ]),
  work: PropTypes.oneOf([
    undefined,
    PropTypes.object,
  ]),
}

const StyledIssue = styled.div`
  flex: 1;
  width: 100%;
  min-width: 600px;
  background: ${theme.contentBackground};
  display: flex;
  padding-left: 10px;
  height: 112px;
  align-items: center;
  border-radius: 3px;
  border: 1px solid ${theme.contentBorder};
  margin-bottom: -1px;
  position: relative;
  > :nth-child(2) {
    /* checkbox */
    margin-right: 21.5px;
    justify-content: center;
    z-index: 2;
  }
`
const IssueDetails = styled.div`
  display: flex;
`
const IssueDesc = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  height: 90px;
  justify-content: space-around;
  padding: 10px;
`
const BalanceAndContext = styled.div`
  margin-right: 20px;
  display: inline-flex;
`

export default Issue
