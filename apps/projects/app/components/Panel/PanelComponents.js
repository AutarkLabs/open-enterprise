import React from 'react'
import styled from 'styled-components'
import { Text, useTheme, Link } from '@aragon/ui'
import { IconGitHub } from '../Shared'
import { issueShape } from '../../utils/shapes.js'

export const IssueTitleLink = ({ issue }) => {
  const theme = useTheme()

  return (
    <Link
      href={issue.url}
      target="_blank"
      style={{ textDecoration: 'none' }}
    >
      <IssueLinkRow>
        <div css="margin-top: 2px">
          <IconGitHub
            color={`${theme.surfaceContentSecondary}`}
            width="16px"
            height="16px"
          />
        </div>
        <Text css="margin-left: 6px" color={`${theme.link}`}>
          {issue.repo} #{issue.number}
        </Text>
      </IssueLinkRow>
    </Link>
  )
}
IssueTitleLink.propTypes = issueShape

export const IssueTitle = ({ issue }) => (
  <div>
    <IssueText>
      <Text css={'font-size: 18px;'}>{issue.title}</Text>
    </IssueText>
    <IssueTitleLink issue={issue} />
  </div>
)
IssueTitle.propTypes = issueShape

export const IssueText = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`
const IssueLinkRow = styled.div`
  height: 31px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`
