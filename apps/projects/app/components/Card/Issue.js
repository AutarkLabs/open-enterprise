import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Text, Tag, Checkbox, ContextMenu, GU, useLayout, useTheme, IconClock, IconConnect, IconCalendar } from '@aragon/ui'

import { formatDistance } from 'date-fns'
import { BountyContextMenu } from '../Shared'
import { BOUNTY_STATUS, BOUNTY_BADGE_COLOR } from '../../utils/bounty-status'
import { IconBarbell } from '../../assets'

const DeadlineDistance = date =>
  formatDistance(new Date(date), new Date(), { addSuffix: true })

const dot = <span css="margin: 0px 10px">&middot;</span>

const labelsTags = (labels, theme) =>
  labels.edges.map(label => (
    <Tag
      key={label.node.id}
      css="margin-right: 10px; width: auto"
      background={'#' + label.node.color + '99'}
      color={`${theme.surfaceContent}`}
      uppercase={false}
    >
      {label.node.name}
    </Tag>
  ))

const FlexibleDiv = ({ compact, newline, children }) => {
  return newline ? (
    <div>
      {children}
    </div>
  ) : (
    <React.Fragment>
      {!compact ? dot : ' '}
      {children}
    </React.Fragment>
  )
}

FlexibleDiv.propTypes = {
  compact: PropTypes.bool,
  newline: PropTypes.bool,
  children: PropTypes.node.isRequired,
}

const Issue = ({ isSelected, onClick, onSelect, ...issue }) => {
  const theme = useTheme()
  const { layoutName } = useLayout()
  const {
    workStatus,
    title,
    repo,
    number,
    labels,
    balance = 10,
    symbol = 'AUT',
    deadline = '2049-01-01 00:00',
    expLevel = 'easy',
    createdAt,
  } = issue

  return (
    <StyledIssue theme={theme}>
      <IssueWrap>
        <div css="padding: 20px 10px">
          <Checkbox checked={isSelected} onChange={() => onSelect(issue)} />
        </div>

        <IssueData>
          <IssueMain>
            <div>
              <a
                href={`#${number}`}
                css="text-decoration: none"
                onClick={e => {
                  e.preventDefault()
                  onClick(issue.id)
                }}
              >
                <IssueTitle theme={theme}>{title}</IssueTitle>
              </a>

              {labels.totalCount > 0 && layoutName !== 'small' && (
                <span>
                  {labelsTags(labels, theme)}
                </span>
              )}
            </div>

            <div css="display: flex;">
              {layoutName !== 'small' && (
                <Balance>
                  {BOUNTY_STATUS[workStatus] && (
                    <Tag
                      css="padding: 10px; margin-right: 10px;"
                      background={BOUNTY_BADGE_COLOR[workStatus].bg}
                      color={BOUNTY_BADGE_COLOR[workStatus].fg}
                    >
                      {balance + ' ' + symbol}
                    </Tag>
                  )}
                </Balance>
              )}
              <ContextMenu>
                <BountyContextMenu issue={issue} />
              </ContextMenu>
            </div>
          </IssueMain>

          <IssueDetails>
            <Text.Block color={`${theme.surfaceContentSecondary}`} size="small">
              <span css="font-weight: 600; white-space: nowrap">{repo} #{number}</span>
              <FlexibleDiv
                compact={layoutName === 'small'}
                newline={false}
              >
                <span css="white-space: nowrap">
                  <IconClock color={`${theme.surfaceIcon}`} css="margin-bottom: -8px; margin-right: 4px" />
                opened {DeadlineDistance(createdAt)}
                </span>
              </FlexibleDiv>
              {labels.totalCount > 0 && layoutName === 'small' && (
                <div css={`padding-top: ${GU}px`}>
                  {labelsTags(labels, theme)}
                </div>
              )}
              {BOUNTY_STATUS[workStatus] && layoutName !== 'small' && (
                <React.Fragment>
                  <FlexibleDiv
                    compact={layoutName !== 'large'}
                    newline={layoutName !== 'large'}
                  >
                    <span css="white-space: nowrap">
                      <IconConnect color={`${theme.surfaceIcon}`} css="margin-bottom: -8px" /> {balance > 0
                        ? BOUNTY_STATUS[workStatus]
                        : BOUNTY_STATUS['fulfilled']}
                    </span>
                    {dot}
                    <span css="white-space: nowrap">
                      <div css={`
                      display: inline-block;
                      vertical-align: bottom;
                      margin-right: 6px;
                      margin-bottom: -8px;
                    `}>
                        <IconBarbell color={`${theme.surfaceIcon}`} />
                      </div>
                      {expLevel}
                    </span>
                    {dot}
                    <span css="white-space: nowrap">
                      <IconCalendar color={`${theme.surfaceIcon}`} css="margin-bottom: -8px; margin-right: 4px" />
                      Due {DeadlineDistance(deadline)}
                    </span>
                  </FlexibleDiv>
                </React.Fragment>
              )}
            </Text.Block>
          </IssueDetails>
        </IssueData>
      </IssueWrap>
      {BOUNTY_STATUS[workStatus] && layoutName === 'small' && (
        <IssueDivider>
          <div css='width: calc(100% - 60px)'>
            <Text.Block color={`${theme.surfaceContentSecondary}`} size="small">
              <span css="white-space: nowrap">
                <IconConnect color={`${theme.surfaceIcon}`} css="margin-bottom: -8px" /> {balance > 0
                  ? BOUNTY_STATUS[workStatus]
                  : BOUNTY_STATUS['fulfilled']}
              </span>
              {dot}
              <span css="white-space: nowrap">
                <div css={`
                display: inline-block;
                vertical-align: bottom;
                margin-right: 6px;
                margin-bottom: -8px;
              `}>
                  <IconBarbell color={`${theme.surfaceIcon}`} />
                </div>
                {expLevel}
              </span>
              {dot}
              <span css="white-space: nowrap">
                <IconCalendar color={`${theme.surfaceIcon}`} css="margin-bottom: -8px; margin-right: 4px" />
                Due {DeadlineDistance(deadline)}
              </span>
            </Text.Block>
          </div>
          <Tag
            background={BOUNTY_BADGE_COLOR[workStatus].bg}
            color={BOUNTY_BADGE_COLOR[workStatus].fg}
          >
            {balance + ' ' + symbol}
          </Tag>
        </IssueDivider>
      )}
    </StyledIssue>
  )
}

Issue.propTypes = {
  title: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  number: PropTypes.number.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  workStatus: PropTypes.oneOf([
    undefined,
    'funded',
    'review-applicants',
    'in-progress',
    'review-work',
    'fulfilled',
  ]),
  work: PropTypes.object,
}

const StyledIssue = styled.div`
  width: 100%;
  background: ${props => props.theme.background};
  background-color: ${props => props.theme.surface};
  height: auto;
  border: 1px solid ${props => props.theme.border};
  margin-bottom: -1px;
  position: relative;
  :first-child {
    border-radius: 3px 3px 0 0;
  }
  :last-child {
    border-radius: 0 0 3px 3px;
  }
`
const IssueWrap = styled.div`
  width: 100%;
  display: flex;
  height: auto;
  align-items: flex-start;
`
const IssueData = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 18px 18px 18px 0;
  position: relative;
  width: calc(100% - 46px);
`
const IssueDetails = styled.div`
  width: 100%;
`
const IssueMain = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`
const IssueDivider = styled.div`
  width: 100%;
  border-top: 1px solid rgba(221, 228, 233, 0.25);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px 8px 44px;
`
const Balance = styled.div`
  margin-left: 10px;
  padding-top: 5px;
`
const IssueTitle = styled(Text).attrs({
  size: 'large',
})`
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${props => props.theme.surfaceContent};
  font-size: 1.2em;
  margin-right: 10px;
`

export default Issue
