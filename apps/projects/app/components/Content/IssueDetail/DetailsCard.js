import React from 'react'
import PropTypes from 'prop-types'
import {
  ContextMenu,
  GU,
  Tag,
  Text,
  useTheme,
} from '@aragon/ui'
import { BountyContextMenu } from '../../Shared'
import { BOUNTY_BADGE_COLOR } from '../../../utils/bounty-status'
import { Markdown } from '../../../../../../shared/ui'
import Label from './Label'
import { issueShape } from '../../../utils/shapes.js'
import { IssueTitleLink } from '../../Panel/PanelComponents'
import { formatDistance } from 'date-fns'

const DeadlineDistance = ({ date }) =>
  formatDistance(new Date(date), new Date(), { addSuffix: true })

const SummaryCell = ({ label, children, grid }) => (
  <div css={`
    display: flex;
    flex-direction: column;
    grid-area: ${grid};
    overflow: hidden;
  `}>
    <Label text={label} />
    <div css={`
      height: 100%;
      display: flex;
      align-items: center;
      margin-top: ${2 * GU}px;
    `}>
      {children}
    </div>
  </div>
)
SummaryCell.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  grid: PropTypes.string.isRequired,
}

const SummaryTable = ({ issue }) => (
  <div css={`
    margin-top: ${1.5 * GU}px;
    ${issue.hasBounty && `
      display: grid;
      grid-template-rows: auto;
      grid-gap: ${3 * GU}px;
      grid-template-columns: 1fr 1fr;
      grid-template-areas:
        'deadline exp'
        'description description';
    `}
  `}>
    {issue.hasBounty &&
      <>
        <SummaryCell label="Deadline" grid="deadline">
          <Text.Block>
            <DeadlineDistance date={issue.deadline} />
          </Text.Block>
        </SummaryCell>
        <SummaryCell label="Difficulty" grid="exp">
          <Text.Block>
            {issue.expLevel}
          </Text.Block>
        </SummaryCell>
      </>
    }
    <SummaryCell label="Description" grid="description">
      <Markdown
        content={issue.body || 'No description available'}
        style={{ marginBottom: 2 * GU + 'px' }}
      />
    </SummaryCell>
  </div>
)

SummaryTable.propTypes = issueShape

const DetailsCard = ({ issue }) => {
  const theme = useTheme()

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
        margin-bottom: ${2 * GU};
      `}>
        <div css={`
          display: flex;
          flex-direction: column;
          flex-basis: 100%;
          flex: 2;
          margin-right: 20px;
        `}>
          <Text.Block size="xxlarge" style={{ marginBottom: (1.5 * GU) + 'px' }}>
            {issue.title}
          </Text.Block>
          <IssueTitleLink issue={issue} />
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
              css="padding: 10px; text-size: large; margin-top: 15px"
              background={BOUNTY_BADGE_COLOR[issue.workStatus].bg}
              color={BOUNTY_BADGE_COLOR[issue.workStatus].fg}
            >
              {issue.balance + ' ' + issue.symbol}
            </Tag>
          )}
        </div>

      </div>

      <SummaryTable issue={issue} />

      <Text size="small" color={`${theme.surfaceContentSecondary}`}>
        {issue.labels.totalCount
          ? issue.labels.edges.map(label => (
            <Tag
              key={label.node.id}
              style={{ marginRight: '5px', marginTop: '20px' }}
              background={'#' + label.node.color + '99'}
              color={`${theme.content}`}
              uppercase={false}
            >
              {label.node.name}
            </Tag>
          ))
          : ''}
      </Text>
    </div>
  )
}

DetailsCard.propTypes = issueShape

// eslint-disable-next-line import/no-unused-modules
export default DetailsCard
