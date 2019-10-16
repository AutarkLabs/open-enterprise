import React from 'react'
import PropTypes from 'prop-types'
import {
  ContextMenu,
  GU,
  Link,
  Tag,
  Text,
  Timer,
  useTheme,
} from '@aragon/ui'
import { BountyContextMenu } from '../../Shared'
import { BOUNTY_BADGE_COLOR } from '../../../utils/bounty-status'
import { Markdown } from '../../../../../../shared/ui'
import Label from './Label'
import { issueShape, userGitHubShape } from '../../../utils/shapes.js'
import { IssueTitleLink } from '../../Panel/PanelComponents'

const DetailsCard = ({ issue }) => {
  const theme = useTheme()

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

  const OpenedBy = ({ author }) => (
    <Text size="large" css="display: flex; align-items: center">
      <img src={author.avatarUrl} alt="user avatar" css="margin: 8px; width: 24px; border-radius: 50%;" />
      <Link
        href={author.url}
        target="_blank"
        style={{ textDecoration: 'none', color: `${theme.link}` }}
      >
        {author.login}
      </Link>
    </Text>
  )
  OpenedBy.propTypes = userGitHubShape

  const SummaryTable = ({ issue }) => (
    <div css={`
      display: grid;
      grid-template-columns: repeat(${issue.hasBounty ? '3' : '4'}, 1fr);
      grid-template-rows: auto;
      ${issue.hasBounty ? `
        grid-template-areas:
          'deadline exp openedby' 'description description description'
        ` : `
        grid-template-areas:
          'description description description openedby'
        `
    };
      grid-gap: 12px;
      align-items: stretch;
    `}>
      {issue.hasBounty ? (
        <React.Fragment>
          <SummaryCell label="Time until due" grid="deadline">
            <Timer end={new Date(issue.deadline)} />
          </SummaryCell>
          <SummaryCell label="Difficulty" grid="exp">
            <Text.Block>
              {issue.expLevel}
            </Text.Block>
          </SummaryCell>
          <SummaryCell label="Opened by" grid="openedby">
            <OpenedBy author={issue.author} />
          </SummaryCell>
          <SummaryCell label="Description" grid="description">
            <Markdown
              content={issue.body || 'No description available'}
              style={{ marginTop: '20px', marginBottom: '20px' }}
            />
          </SummaryCell>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <SummaryCell label="Description" grid="description">
            <Markdown
              content={issue.body || 'No description available'}
              style={{ margin: (2 * GU) + 'px 0', width: '100%' }}
            />
          </SummaryCell>
          <div css="grid-area: openedby">
            <Label text="Opened by" />
            <OpenedBy author={issue.author} />
          </div>
        </React.Fragment>
      )}

    </div>
  )

  SummaryTable.propTypes = issueShape

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