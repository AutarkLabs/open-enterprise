import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, theme, Badge, Button, ContextMenu, ContextMenuItem } from '@aragon/ui'
import { formatDistance } from 'date-fns'

import { CheckButton } from '../Shared'

/*
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
    /* checkbox * /
    margin-right: 21.5px;
    justify-content: center;
    z-index: 2;
  }
  > :nth-child(3) {
    /* text * /
    height: 100%;
    padding: 10px;
    flex: 1 1 auto;
  }
*/

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
const ETADistance = date => formatDistance(new Date(date), new Date())

const dot = <span style={{ margin: '0px 10px' }}>&middot;</span>

const Issue = ({
  workStatus,
  title,
  repo,
  number,
  labels,
  isSelected,
  onSelect,
  onClick,
  onSubmitWork,
  onRequestAssignment,
  onReviewApplication,
  onAllocateSingleBounty,
  balance,
  symbol,
 
  deadline,
  requestsData,
  bountySettings,
 
  expLevel = 'Intermediate',
  dueDate = '02/02/2020',

  funded = 'Pending funding'
}) => (
// TODO: @aragon/ui Table?
// workStatus can be either: 'new', 'review-applicants', 'review-work', or 'finished'
// It represents the state of the current issue in the approval bounty flow
  <StyledIssue>
    <ClickArea onClick={onClick} />
    <CheckButton checked={isSelected} onChange={onSelect} />
    <IssueDesc>
      <div>
        <Text color={theme.textPrimary} size="xlarge">
          {title}
        </Text>
        {dot}
        <Text color={theme.textSecondary} size="large">
          {repo} #{number}
        </Text>
      </div>
      { (balance > 0 || labels.totalCount > 0) && <IssueDetails>
        <Text size="small" color={theme.textTertiary}>
          { balance > 0 &&
            <span style={{ marginRight: '15px'}}>
              {expLevel}
              {dot}
              {ETADistance(dueDate)}
              {dot}
              {funded}
              {workStatus === 'review-applicants' &&
                <span>
                  {dot}
                  Applicants: {requestsData.length}
                </span>
              }
            </span>
          }
          { labels.totalCount ? (
            labels.edges.map(label =>
              <Badge
                key={label.node.id}
                style={{ marginRight: '10px'}}
                background={'#'+label.node.color}
                foreground={'#000'}>{label.node.name}
              </Badge>
            )) : ''
          }        
        </Text>
      </IssueDetails>
      }
    </IssueDesc>
    <BalanceAndContext>
      { balance > 0 &&  
        <Badge
          style={{padding: '10px', marginRight: '20px', textSize: 'large'}}
          background={'#e7f8ec'}
          foreground={theme.positive}>{balance + ' ' + symbol}
        </Badge>
      }
      <ContextMenu>
        {workStatus === undefined &&
          <ContextMenuItem onClick={onAllocateSingleBounty}>
            <ActionLabel>Allocate Bounty</ActionLabel>
          </ContextMenuItem>
        }
        {(workStatus === 'submit-work' || workStatus === 'review-work') &&
          <ContextMenuItem onClick={onSubmitWork}>
            <ActionLabel>Submit Work</ActionLabel>
          </ContextMenuItem>
        }
        {(workStatus === 'new' || workStatus === 'review-applicants') &&
          <ContextMenuItem onClick={onRequestAssignment}>
            <ActionLabel>Request Assignment</ActionLabel>
          </ContextMenuItem>
        }
        {workStatus === 'review-applicants' &&
          <ContextMenuItem onClick={onReviewApplication}>
            <ActionLabel>Review Application ({requestsData.length})</ActionLabel>
          </ContextMenuItem>
        }
      </ContextMenu>
    </BalanceAndContext>
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

/*const MenuContainer = styled.div`
  align-self: flex-end;
  align-items: center;
`
*/
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
const IssueDetails = styled.div`
  display: flex;
`
const IssueDesc = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 90px;
`
const BalanceAndContext = styled.div`
  margin-right: 20px;
  display: inline-flex;
`



export default Issue
