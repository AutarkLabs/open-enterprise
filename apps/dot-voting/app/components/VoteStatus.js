import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { IconCheck, IconCross, IconTime, theme } from '@aragon/ui'
import {
  VOTE_STATUS_EXECUTED,
  VOTE_STATUS_FAILED,
  VOTE_STATUS_ONGOING,
  VOTE_STATUS_SUCCESSFUL
} from '../utils/vote-types'
import { getVoteStatus } from '../utils/vote-utils'

const ATTRIBUTES = {
  [VOTE_STATUS_ONGOING]: {
    label: 'Ongoing',
    Icon: IconTime,
    color: theme.textSecondary,
  },
  [VOTE_STATUS_SUCCESSFUL]: {
    label: 'Approved',
    Icon: IconCheck,
    color: theme.positive,
  },
  [VOTE_STATUS_EXECUTED]: {
    label: 'Approved and executed',
    Icon: IconCheck,
    color: theme.positive,
  },
  [VOTE_STATUS_FAILED]: {
    label: 'Rejected',
    Icon: IconCross,
    color: theme.negative,
  },
}

const VoteStatus = ({ vote }) => {
  const status = getVoteStatus(vote)
  const { color, label, Icon } = ATTRIBUTES[status]
  return (
    <Main color={color}>
      <Icon />
      <StatusLabel>{label}</StatusLabel>
    </Main>
  )
}

VoteStatus.propTypes = {
  vote: PropTypes.object.isRequired,
}

const Main = styled.span`
  white-space: nowrap;
  color: ${({ color }) => color};
`

const StatusLabel = styled.span`
  margin-left: 10px;
`

export default VoteStatus
