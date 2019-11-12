import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { format } from 'date-fns'
import { Box, Countdown, GU } from '@aragon/ui'
import VoteStatus from '../VoteStatus'

const PastDate = styled.time`
  font-size: 13px;
  color: #98a0a2;
  margin-top: 6px;
  display: block;
`

const Status = ({ vote }) => (
  <Box heading="Status" padding={0}>
    <div css={`padding: ${2 * GU}px ${3 * GU}px`}>
      {vote.open && (
        <h2 css={`margin-bottom: ${GU}px`}>Time Remaining</h2>
      )}
      <div>
        {vote.open ? (
          <Countdown end={vote.endDate} />
        ) : (
          <React.Fragment>
            <VoteStatus
              vote={vote}
              support={vote.support}
              tokenSupply={vote.data.totalVoters}
            />
            <PastDate
              dateTime={format(vote.endDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')}
            >
              {format(vote.endDate, 'MMM dd yyyy HH:mm')}
            </PastDate>
          </React.Fragment>
        )}
      </div>
    </div>
  </Box>
)

Status.propTypes = {
  vote: PropTypes.object.isRequired,
}

export default Status
