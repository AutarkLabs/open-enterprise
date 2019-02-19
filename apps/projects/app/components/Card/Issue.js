import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, theme, Badge, Button, ContextMenu, ContextMenuItem } from '@aragon/ui'

import { CheckButton } from '../Shared'

const StyledIssue = styled.div`
  //overflow-y: hidden;
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
`

// TODO: @aragon/ui Table?
const Issue = ({workStatus, title, repo, number, labels, isSelected, onSelect, onSubmitWork, onRequestAssignment, onReviewApplication, balance, symbol }) => (
  <StyledIssue>
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
          { labels.totalCount ? (
            labels.edges.map(label =>
              <Badge
                key={label.node.id}
                style={{ marginLeft: '5px'}}
                background={'#'+label.node.color}
                foreground={'#000'}>{label.node.name}
              </Badge>
            )) : ''
          }        
        </Text>
      </IssueDetails>
    </div>
    <div style={{ marginRight: '20px', display: 'inline-flex' }}>
      { balance > 0 &&  
        <Badge
          style={{padding: '10px', marginRight: '20px', textSize: 'large'}}
          background={'#e7f8ec'}
          foreground={theme.positive}>{balance + ' ' + symbol}
        </Badge>
        
      }
      {workStatus !== undefined &&
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
      }
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

const ActionLabel = styled.span`
  margin-left: 15px;
`
const MenuContainer = styled.div`
  align-self: flex-end;
  align-items: center;
`

export default Issue
