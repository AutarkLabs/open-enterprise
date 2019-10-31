import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { format } from 'date-fns'
import { Box, Countdown, theme } from '@aragon/ui'
import VoteStatus from '../VoteStatus'

const PastDate = styled.time`
  font-size: 13px;
  color: ${theme.textTertiary};
  margin-top: 6px;
  display: block;
`

const Status = ({ vote }) => (
  <Box heading="Status">
    <div>
      <h2>
        {vote.open ? 'Time Remaining' : 'Status'}
      </h2>
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
