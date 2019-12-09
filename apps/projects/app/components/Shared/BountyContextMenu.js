import React from 'react'
import styled, { css } from 'styled-components'
import { ContextMenuItem, GU, theme } from '@aragon/ui'
import { usePanelManagement } from '../Panel'
import { issueShape } from '../../utils/shapes.js'
import { IconCoin, IconConnect, IconFile, IconView, useTheme } from '@aragon/ui'
import { useAragonApi } from '../../api-react'

const BountyContextMenu = ({ issue }) => {
  const pastDeadline = (new Date()) > (new Date(issue.deadline))
  const { workStatus, assignee } = issue
  const { connectedAccount } = useAragonApi()
  const {
    allocateBounty,
    requestAssignment,
    reviewApplication,
    reviewWork,
    submitWork,
  } = usePanelManagement()
  const theme = useTheme()

  return (
    <React.Fragment>
      {workStatus === undefined && (
        <Item onClick={() => allocateBounty([issue])}>
          <IconCoin color={`${theme.surfaceContent}`} />
          <ActionLabel>
            Fund issue
          </ActionLabel>
        </Item>
      )}
      {workStatus === 'in-progress' && (
        <React.Fragment>
          {(connectedAccount === assignee) && (
            <Item onClick={() => submitWork(issue)}>
              <IconConnect color={`${theme.surfaceContent}`} />
              <ActionLabel>
                Submit work
              </ActionLabel>
            </Item>
          )}
          <Item onClick={() => reviewApplication(issue)}>
            <IconView color={`${theme.surfaceContent}`} />
            <ActionLabel>
              View applications ({issue.requestsData.length})
            </ActionLabel>
          </Item>

        </React.Fragment>
      )}
      {workStatus === 'review-work' && (
        <React.Fragment>
          <Item onClick={() => reviewWork(issue)}>
            <IconView color={`${theme.surfaceContent}`} />
            <ActionLabel>
              View work
            </ActionLabel>
          </Item>
          <Item onClick={() => reviewApplication(issue)}>
            <IconView color={`${theme.surfaceIcon}`} />
            <ActionLabel>
              View applications ({issue.requestsData.length})
            </ActionLabel>
          </Item>
        </React.Fragment>
      )}
      {workStatus === 'funded' && (
        <React.Fragment>
          <Item onClick={() => requestAssignment(issue)}>
            <IconFile color={`${theme.surfaceContent}`} />
            <ActionLabel>
              Submit application
            </ActionLabel>
          </Item>
          {/* Disabled since the contract doesn't allow updating the amount */}
          {/* <Item bordered onClick={() => editBounty([issue])}> */}
          {/*   Update Funding */}
          {/* </Item> */}
        </React.Fragment>
      )}
      {workStatus === 'review-applicants' && (
        <React.Fragment>
          {!pastDeadline && (
            <Item onClick={() => requestAssignment(issue)}>
              <IconFile color={`${theme.surfaceContent}`} />
              <ActionLabel>
                Submit application
              </ActionLabel>
            </Item>
          )}
          <Item onClick={() => reviewApplication(issue)}>
            <IconView color={`${theme.surfaceContent}`} />
            <ActionLabel>
              View applications ({issue.requestsData.length})
            </ActionLabel>
          </Item>
          {/* Disabled since the contract doesn't allow updating the amount */}
          {/*<Item bordered onClick={() => editBounty([issue])}>*/}
          {/*  <IconCoin color={`${theme.surfaceContent}`} />*/}
          {/*  <ActionLabel>*/}
          {/*    Update Funding*/}
          {/*  </ActionLabel>*/}
          {/*</Item>*/}
        </React.Fragment>
      )}
      {workStatus === 'fulfilled' && (
        <React.Fragment>
          <Item onClick={() => reviewWork(issue)}>
            <IconView color={`${theme.surfaceIcon}`} />
            <ActionLabel>
              View work
            </ActionLabel>
          </Item>
          <Item onClick={() => reviewApplication(issue)}>
            <IconView color={`${theme.surfaceIcon}`} />
            <ActionLabel>
              View applications ({issue.requestsData.length})
            </ActionLabel>
          </Item>
        </React.Fragment>
      )}
    </React.Fragment>
  )
}

const Item = styled(ContextMenuItem)`
  display: flex;
  align-items: center;
  padding: ${1 * GU}px ${2 * GU}px;
  ${props =>
    props.bordered &&
    css`
      border-top: 1px solid ${theme.shadow};
    `};
`
const ActionLabel = styled.span`
  margin-left: 8px;
`

BountyContextMenu.propTypes = issueShape

export default BountyContextMenu
