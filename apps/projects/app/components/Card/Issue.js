import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Text, theme, Badge, Checkbox, ContextMenu } from '@aragon/ui'

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
      style={{ marginRight: '10px', width: 'auto' }}
      background={'#' + label.node.color + '99'}
      foreground={theme.textPrimary}
    >
      {label.node.name}
    </Badge>
  ))

class Issue extends React.PureComponent {
  render() {
    const {
      isSelected,
      onClick,
      onSelect,
      onSubmitWork,
      onRequestAssignment,
      onReviewApplication,
      onAllocateSingleBounty,
      onUpdateBounty,
      onReviewWork,
      ...issue
    } = this.props

    const {
      id,
      work,
      workStatus,
      title,
      repo,
      number,
      labels,
      balance,
      symbol,
      deadline,
      requestsData,
      expLevel,
    } = issue

    return (
      <StyledIssue>
        <div style={{ padding: '10px' }}>
          <Checkbox checked={isSelected} onChange={() => onSelect(issue)} />
        </div>

        <IssueData>
          <ClickArea onClick={() => onClick(issue)} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text
              color={theme.textSecondary}
              size="xsmall"
              style={{ wordWrap: 'break-word' }}
            >
              {repo} #{number}
            </Text>
            {workStatus !== 'fulfilled' && (
              <ContextMenu>
                <BountyContextMenu
                  work={work}
                  workStatus={workStatus}
                  requestsData={requestsData}
                  onAllocateSingleBounty={() => onAllocateSingleBounty(issue)}
                  onSubmitWork={() => onSubmitWork(issue)}
                  onRequestAssignment={() => onRequestAssignment(issue)}
                  onReviewApplication={() => onReviewApplication(issue)}
                  onReviewWork={() => onReviewWork(issue)}
                  onUpdateBounty={() => onUpdateBounty(issue)}
                />
              </ContextMenu>
            )}
          </div>
          <IssueTitleDetailsBalance>
            <IssueTitleDetails>
              <IssueTitle>{title}</IssueTitle>

              {BOUNTY_STATUS[workStatus] && (
                <Text.Block
                  color={theme.textSecondary}
                  style={{ fontSize: '0.87em' }}
                >
                  <span style={{ marginRight: '15px' }}>
                    {expLevel}
                    {dot}
                    {balance > 0
                      ? BOUNTY_STATUS[workStatus]
                      : BOUNTY_STATUS['fulfilled']}
                    {dot}
                    Due {DeadlineDistance(deadline)}
                  </span>
                </Text.Block>
              )}
            </IssueTitleDetails>

            <Balance>
              {BOUNTY_STATUS[workStatus] && (
                <Badge
                  style={{ padding: '10px' }}
                  background={BOUNTY_BADGE_COLOR[workStatus].bg}
                  foreground={BOUNTY_BADGE_COLOR[workStatus].fg}
                >
                  <Text>{balance + ' ' + symbol}</Text>
                </Badge>
              )}
            </Balance>
          </IssueTitleDetailsBalance>

          {labels.totalCount > 0 && (
            <div>
              <Separator />
              {labelsBadges(labels)}
            </div>
          )}
        </IssueData>
      </StyledIssue>
    )
  }
}

Issue.propTypes = {
  title: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  number: PropTypes.number.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onSubmitWork: PropTypes.func.isRequired,
  onRequestAssignment: PropTypes.func.isRequired,
  onReviewApplication: PropTypes.func.isRequired,
  onAllocateSingleBounty: PropTypes.func.isRequired,
  onUpdateBounty: PropTypes.func.isRequired,
  onReviewWork: PropTypes.func.isRequired,
  workStatus: PropTypes.oneOf([
    undefined,
    'funded',
    'review-applicants',
    'in-progress',
    'review-work',
    'fulfilled',
  ]),
  work: PropTypes.oneOf([ undefined, PropTypes.object ]),
}

const StyledIssue = styled.div`
  flex: 1;
  width: 100%;
  background: ${theme.contentBackground};
  display: flex;
  height: auto;
  align-items: center;
  margin-bottom: -1px;
  position: relative;
`
const IssueTitleDetailsBalance = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`
const IssueTitleDetails = styled.div`
  display: flex;
  flex-direction: column;
  word-break: break-word;
  padding-right: 47px;
  > :not(:last-child) {
    margin-bottom: 6px;
  }
`
const IssueData = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: space-around;
  padding: 18px 18px 18px 0;
  position: relative;
`
const Balance = styled.div`
  margin-left: 10px;
  padding-top: 5px;
`
const IssueTitle = styled(Text.Block).attrs({
  size: 'large',
})`
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-wrap: break-word;
  color: ${theme.textPrimary};
  font-size: 1.2em;
`
const Separator = styled.hr`
  height: 1px;
  width: 100%;
  color: ${theme.contentBorder};
  opacity: 0.1;
  margin: 8px 0;
`

export default Issue
