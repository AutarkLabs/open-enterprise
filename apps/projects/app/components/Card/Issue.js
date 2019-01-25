import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, theme, Badge } from '@aragon/ui'

import { CheckButton } from '../Shared'

const StyledIssue = styled.div`
  overflow-y: hidden;
  flex: 1;
  width: 100%;
  background: ${theme.contentBackground};
  display: flex;
  padding-left: 10px;
  height: 112px;
  align-items: center;
  border-radius: 3px;
  border: 1px solid ${theme.contentBorder};
  position: relative;
  > :first-child {
    margin-right: 21.5px;
    justify-content: center;
  }
  > :nth-child(2) {
    height: 100%;
    padding: 10px;
    flex: 1 1 auto;
  }
`
const IssueDetails = styled.div`
  display: flex;
  justify-content: space-between;
`

// TODO: @aragon/ui Table?
const Issue = ({ title, repo, number, labels, isSelected, onSelect }) => (
  <StyledIssue>
    <CheckButton checked={isSelected} onChange={onSelect} />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        height: '100px',
        flex: '1',
      }}
    >
      <div>
        <Text
          color={theme.textPrimary}
          size="xlarge"
          style={{ marginRight: '5px' }}
        >
          {title}
        </Text>
        <Text color={theme.textSecondary}>
          • {repo} #{number}
        </Text>
      </div>
      <IssueDetails>
        <Text.Block size="small" color={theme.textTertiary}>
          { labels.totalCount ? (
            labels.edges.map(label =>
              <Badge
                key={label.node.id}
                style={{ marginLeft: '5px'}}
                background={'#'+label.node.color}
                foreground={'#000'}>{label.node.name}
              </Badge>
            )) : ''
          }        </Text.Block>
      </IssueDetails>
    </div>
  </StyledIssue>
)

Issue.propTypes = {
  title: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  number: PropTypes.number.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
}

export default Issue
