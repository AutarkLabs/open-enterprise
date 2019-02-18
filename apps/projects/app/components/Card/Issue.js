import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, theme, Badge, Button, ContextMenu, ContextMenuItem } from '@aragon/ui'

import { CheckButton } from '../Shared'

const StyledIssue = styled.div`
  flex: 1;
  width: 100%;
  background: ${theme.contentBackground};
  display: flex;
  padding-left: 10px;
  height: 112px;
  align-items: center;
  border: 1px solid ${theme.contentBorder};
  margin-bottom: -1px;
  position: relative;
  > :nth-child(2) {
    /* checkbox */
    margin-right: 21.5px;
    justify-content: center;
    z-index: 2;
  }
  > :nth-child(3) {
    /* text */
    height: 100%;
    padding: 10px;
    flex: 1 1 auto;
  }
`

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

const IssueDetails = styled.div`
  display: flex;
`

const Issue = ({ title, repo, number, labels, isSelected, onClick, onSelect, onSubmitWork, onRequestAssignment, onReviewApplication}) => (
  <StyledIssue>
    <ClickArea onClick={onClick} />
    <CheckButton checked={isSelected} onChange={onSelect} />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        height: '90px',
        flex: '1',
      }}
    >
      <div>
        <Text
          color={theme.textPrimary}
          size="large"
          style={{ marginRight: '5px' }}
        >
          {title}
        </Text>
      </div>
      <IssueDetails>
        <Text color={theme.textSecondary}>
          {repo} #{number}
        </Text>
        <Text size="small" color={theme.textTertiary}>
          {labels.totalCount
            ? labels.edges.map(label => (
              <Badge
                key={label.node.id}
                style={{ marginLeft: '5px' }}
                background={'#' + label.node.color}
                foreground={'#000'}
              >
                {label.node.name}
              </Badge>
            ))
            : ''}
        </Text>
      </IssueDetails>
    </div>
    <div style={{ marginRight: '20px' }}>
      <ContextMenu>
        <ContextMenuItem onClick={onSubmitWork}>
          <ActionLabel>Submit Work</ActionLabel>
        </ContextMenuItem>
        <ContextMenuItem onClick={onRequestAssignment}>
          <ActionLabel>Request Assignment</ActionLabel>
        </ContextMenuItem>
        <ContextMenuItem onClick={onReviewApplication}>
          <ActionLabel>Review Application</ActionLabel>
        </ContextMenuItem>
      </ContextMenu>
    </div>
  </StyledIssue>
)

Issue.propTypes = {
  title: PropTypes.string.isRequired,
  repo: PropTypes.string.isRequired,
  number: PropTypes.number.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
}

const ActionLabel = styled.span`
  margin-left: 15px;
`
const MenuContainer = styled.div`
  align-self: flex-end;
  align-items: center;
`

export default Issue
