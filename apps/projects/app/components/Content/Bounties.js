import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useBountyIssues } from '../../context/BountyIssues.js'
import { formatDistance } from 'date-fns'
import { EmptyWrapper, Tabs } from '../Shared'
import usePathHelpers from '../../../../../shared/utils/usePathHelpers'

import {
  BREAKPOINTS,
  Card,
  EmptyStateCard,
  GU,
  Header,
  IconFundraising,
  IconTime,
  Tag,
  Text,
  textStyle,
  useTheme,
} from '@aragon/ui'

import empty from '../../assets/empty.svg'

const illustration = <img src={empty} alt="" height="160" />

const TABS = [ 'Accepting applications', 'Accepting work submissions', 'Review' ]

const Wrap = ({ children }) => (
  <>
    <Header primary="Projects" />
    <Tabs />
    {children}
  </>
)

Wrap.propTypes = {
  children: PropTypes.node.isRequired,
}

const IssueTile = ({ issue, selectIssue }) => {
  const theme = useTheme()
  return (
    <Card
      onClick={() => selectIssue(issue.id)}
      css={`
        width: 100%;
        height: auto;
        margin-top: ${GU}px;
        justify-content: flex-start;
        align-items: flex-start;
      `}
    >
      <div css={`
        width: 100%;
        padding: ${GU}px;
        border-bottom: 1px solid ${theme.border};
      `}>
        <h3 css={`${textStyle('body3')}`}>{issue.title}</h3>
        <span css={`${textStyle('body4')} color: ${theme.link}; margin-right: ${2 * GU}px;`}>{issue.repository.name} #{issue.number}</span>
        {issue.balance && issue.symbol && (
          <Tag>{issue.balance} {issue.symbol}</Tag>
        )}
      </div>
      <div css={`
        ${textStyle('body4')}
        color: ${theme.contentSecondary};
        width: 100%;
        padding: ${GU}px;
        display: flex;
        flex-wrap: wrap;
      `}>
        <span css={`
          display: flex;
          align-items: center;
        `}>
          <IconFundraising height='16px' />
          <span>{
            issue.fundingHistory
              ? `${issue.fundingHistory.length} bount${issue.fundingHistory.length === 1 ? 'y' : 'ies'}`
              : '0 bounties'
          }</span>
        </span>
        {issue.deadline && (
          <span css={`
            display: flex;
            align-items: center;
          `}>
            <IconTime height='16px' />
            <span>
              Due {formatDistance(
                new Date(issue.deadline), new Date(), { addSuffix: true }
              )}
            </span>
          </span>
        )}
      </div>
    </Card>
  )
}

IssueTile.propTypes = {
  issue: PropTypes.object.isRequired,
  selectIssue: PropTypes.func.isRequired,
}

const Column = ({ title, issues }) => {
  const theme = useTheme()
  const { requestPath } = usePathHelpers()
  const selectIssue = useCallback(id => {
    requestPath('/issues/' + id)
  })
  return (
    <div css={`
      margin-right: ${GU}px;
      :last-child {
        margin-right: 0;
      }
      scroll-snap-align: start;
    `}>
      <Card
        width='100%'
        height='100%'
        css={`
          padding: ${2 * GU}px;
          justify-content: flex-start;
          align-items: flex-start;
          overflow: auto;
          ::-webkit-scrollbar {
            display: none;
          }
        `}
      >
        <h3 css={`${textStyle('body4')}; color: ${theme.contentSecondary}`}>
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </h3>
        <h2 css={`${textStyle('body2')}; margin: ${GU}px 0`}>{title}</h2>
        {issues.map(issue =>
          <IssueTile key={issue.id} issue={issue} selectIssue={selectIssue} />
        )}
      </Card>
    </div>
  )
}

Column.propTypes = {
  title: PropTypes.string.isRequired,
  issues: PropTypes.array.isRequired,
}

const IssueColumns = ({ issues }) => {
  const tabIssues = useMemo(() => [
    issues.filter(issue =>
      issue.workStatus !== 'review-work' &&
      issue.workStatus !== 'in-progress' &&
      !issue.openSubmission
    ),
    issues.filter(issue =>
      (issue.workStatus === 'in-progress' && !issue.openSubmission) ||
      (issue.workStatus !== 'review-work' && issue.openSubmission)
    ),
    issues.filter(issue =>
      issue.workStatus === 'review-work'
    ),
  ], [issues])

  return (
    <div css={`
      align-items: start;
      overflow-x: scroll;
      display: grid;
      grid-template-columns: 90% 90% 100%;
      scroll-snap-type: x mandatory;
      @media (min-width: ${BREAKPOINTS.medium}px) {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        overflow-x: initial;
      }
    `}>
      <Column title={TABS[0]} issues={tabIssues[0]} />
      <Column title={TABS[1]} issues={tabIssues[1]} />
      <Column title={TABS[2]} issues={tabIssues[2]} />
    </div>
  )
}

IssueColumns.propTypes = {
  issues: PropTypes.array.isRequired,
}

const Bounties = () => {
  const now = new Date()
  const issues = useBountyIssues()
  const unfulfilledIssues = issues
    .filter(issue =>
      issue.workStatus !== 'fulfilled'
    )
    .sort((a, b) => {
      //If a deadline has expired, most recent deadline first
      //If a deadline upcoming, closest to the deadline first
      let aDate = new Date(a.deadline)
      let bDate = new Date(b.deadline)
      if (aDate < now || bDate < now) {
        aDate = now - aDate
        bDate = now - bDate
      }
      return aDate - bDate
    })

  if (unfulfilledIssues.length === 0) {
    return (
      <Wrap>
        <EmptyWrapper>
          <EmptyStateCard
            illustration={illustration}
            text={
              <>
                <Text css={textStyle('title2')}>No bounties here</Text>
                <br />
                <Text css={textStyle('body2')}>
                  Once there are issues with bounties, they’ll show up here
                </Text>
              </>
            }
          />
        </EmptyWrapper>
      </Wrap>
    )
  }

  return (
    <Wrap>
      <IssueColumns issues={unfulfilledIssues} />
    </Wrap>
  )
}

export default Bounties
