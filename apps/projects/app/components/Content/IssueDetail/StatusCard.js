import React from 'react'
import styled from 'styled-components'
import {
  Box,
  useTheme,
  GU,
  Text,
  Button,
} from '@aragon/ui'
//import { usePanelManagement } from '../../Panel'
import { issueShape } from '../../../utils/shapes.js'
import { usePanelManagement } from '../../Panel'
import { BOUNTY_STATUS, BOUNTY_STATUS_LONG } from '../../../utils/bounty-status'

const StatusCard = ({ issue }) => {
  const theme = useTheme()
  const { submitWork, requestAssignment, reviewApplication, reviewWork } = usePanelManagement()
  
  const determineStatus = (workStatus, balance) =>
    Number(balance) === 0 ? BOUNTY_STATUS_LONG['fulfilled'] : BOUNTY_STATUS_LONG[workStatus]
  
  return (
    <Box
      heading="Status"
      css={`
      flex: 0 1 auto;
      text-align: left;
      background: ${theme.surface};
      border: 1px solid ${theme.border};
      border-radius: 3px;
      padding: 0;
      > :second-child {
        padding: ${3 * GU}px;
      }
    `}
    >
      <Text.Block>
        {determineStatus(issue.workStatus)}
      </Text.Block>
      {issue.workStatus === 'funded' && (
        <EventButton
          mode="outline"
          wide
          onClick={() => requestAssignment(issue)}
        >
          <Text weight="bold">
            Submit Application
          </Text>
        </EventButton>
      )}

    </Box>
  )
}

StatusCard.propTypes = issueShape

const EventButton = styled(Button)`
  margin-top: ${2 * GU}px;
  padding: 5px 20px 2px 20px;
  font-size: 15px;
  border-radius: 5px;
`

// eslint-disable-next-line import/no-unused-modules
export default StatusCard