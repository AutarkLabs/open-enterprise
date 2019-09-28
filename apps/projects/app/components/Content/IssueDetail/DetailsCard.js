import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import {
  ContextMenu,
  SafeLink,
  Tag,
  Text,
  useTheme,
} from '@aragon/ui'
import { formatDistance } from 'date-fns'
import { IconGitHub, BountyContextMenu } from '../../Shared'
import { BOUNTY_STATUS, BOUNTY_BADGE_COLOR } from '../../../utils/bounty-status'
import { Markdown } from '../../../../../../shared/ui'
import Label from './Label'
import { issueShape } from '../../../utils/shapes.js'

const calculateAgo = pastDate => formatDistance(pastDate, Date.now(), { addSuffix: true })
const deadlineDistance = date => formatDistance(new Date(date), new Date())

const determineFieldText = (fieldTitle, fieldText, balance) => {
  const isStatusField = fieldTitle.toLowerCase() === 'status'
  const isFulfilled = isStatusField && Number(balance) === 0
  if (isFulfilled) return BOUNTY_STATUS['fulfilled']
  else if (isStatusField) return BOUNTY_STATUS[fieldText]
  return fieldText
}

const SummaryTable = ({ expLevel, deadline, workStatus, balance }) => {
  const theme = useTheme()
  const FIELD_TITLES = [ 'Experience Level', 'Deadline', 'Status' ]

  return (
    <div css={`
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border: solid ${theme.border};
      border-width: 1px 0;
      > :not(:first-child) {
        border-left: 1px solid ${theme.border};
        padding-left: 15px;
    `}>
      {[ expLevel, deadline, workStatus ].map((field, i) => (
        <StyledCell key={i}>
          <Label text={FIELD_TITLES[i]} />
          <Text color={`${theme.textPrimary}`}>
            {determineFieldText(FIELD_TITLES[i], field, balance)}
          </Text>
        </StyledCell>
      ))}
    </div>
  )
}

SummaryTable.propTypes = {
  expLevel: PropTypes.string.isRequired,
  deadline: PropTypes.string.isRequired,
  workStatus: PropTypes.string.isRequired,
  balance: PropTypes.string.isRequired,
}

const DetailsCard = ({ issue }) => {
  const theme = useTheme()
  const summaryData = {
    expLevel: issue.expLevel || '-',
    deadline:
      issue.deadline ? deadlineDistance(issue.deadline) + ' remaining' : '-',
    workStatus: issue.workStatus || 'No bounty yet',
    balance: issue.balance,
  }

  return (
    <div css={`
      flex: 0 1 auto;
      text-align: left;
      padding: 15px 30px;
      background: ${theme.surface};
      border: 1px solid ${theme.border};
      border-radius: 3px;
    `}>
      <div css={`
        display: flex;
        padding-top: 10px;
        justify-content: space-between;
      `}>
        <div css={`
          display: flex;
          flex-direction: column;
          flex-basis: 100%;
          flex: 2;
          margin-right: 20px;
        `}>
          <Text.Block size="xlarge" style={{ marginBottom: '5px' }}>
            {issue.title}
          </Text.Block>
          <SafeLink
            href={issue.url}
            target="_blank"
            style={{ textDecoration: 'none', color: `${theme.accent}` }}
          >
            <IssueLinkRow>
              <IconGitHub color={`${theme.accent}`} width="14px" height="14px" />
              <Text css="margin-left: 6px">
                {issue.repo} #{issue.number}
              </Text>
            </IssueLinkRow>
          </SafeLink>
          <Text.Block
            size="small"
            color={`${theme.surfaceContentSecondary}`}
            style={{ marginBottom: '10px' }}
          >
            {calculateAgo(issue.createdAt)}
          </Text.Block>
        </div>

        <div css={`
          display: flex;
          flex-direction: column;
          flex-basis: 100%;
          flex: 0;
          align-items: flex-end;
        `}>
          <ContextMenu>
            <BountyContextMenu issue={issue} />
          </ContextMenu>
          {issue.balance > 0 && (
            <Tag
              style={{ padding: '10px', textSize: 'large', marginTop: '15px' }}
              background={BOUNTY_BADGE_COLOR[issue.workStatus].bg}
              color={BOUNTY_BADGE_COLOR[issue.workStatus].fg}
            >
              {issue.balance + ' ' + issue.symbol}
            </Tag>
          )}
        </div>
      
      </div>

      {issue.workStatus ? <SummaryTable {...summaryData} /> : <Separator />}
      <Label text="Description" />
      <Markdown
        content={issue.body || 'No description available'}
        style={{ marginTop: '20px', marginBottom: '20px' }}
      />
      <Text size="small" color={`${theme.surfaceContentSecondary}`}>
        {issue.labels.totalCount
          ? issue.labels.edges.map(label => (
            <Tag
              key={label.node.id}
              style={{ marginRight: '5px' }}
              background={'#' + label.node.color + '99'}
              color={`${theme.content}`}
            >
              {label.node.name}
            </Tag>
          ))
          : ''}
      </Text>
    </div>
  )
}

DetailsCard.propTypes = {
  issue: issueShape,
}

const StyledCell = styled.div`
  padding: 20px 0;
  align-items: left;
`
const IssueLinkRow = styled.div`
  height: 31px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`
const Separator = styled.hr`
  height: 1px;
  width: 100%;
  opacity: 0.2;
`
// eslint-disable-next-line import/no-unused-modules
export default DetailsCard