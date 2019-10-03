import React from 'react'
import styled from 'styled-components'
import {
  Box,
  useTheme,
  Button,
} from '@aragon/ui'
//import { usePanelManagement } from '../../Panel'
import { issueShape } from '../../../utils/shapes.js'
import { BOUNTY_STATUS } from '../../../utils/bounty-status'

const StatusCard = ({ issue }) => {
  const theme = useTheme()
  //const { reviewApplication, reviewWork } = usePanelManagement()
  
  const determineStatus = (workStatus, balance) =>
    Number(balance) === 0 ? BOUNTY_STATUS['fulfilled'] : BOUNTY_STATUS[workStatus]
  
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
      > * {
        padding: 16px 0 6px 16px;
      }
      > :not(:last-child) {
        margin-bottom: 0;
      }
      > :not(:last-child) :not(:first-child) {
        border-bottom: 1px solid ${theme.border};
      }
    `}
    >
      {determineStatus(issue.workStatus)}
    </Box>
  )
}

StatusCard.propTypes = issueShape

const EventButton = styled(Button)`
  padding: 5px 20px 2px 20px;
  font-size: 15px;
  border-radius: 5px;
`

// eslint-disable-next-line import/no-unused-modules
export default StatusCard
