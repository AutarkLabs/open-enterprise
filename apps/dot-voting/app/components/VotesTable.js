import React from 'react'
import PropTypes from 'prop-types'
import { compareDesc } from 'date-fns'
import { Table, TableHeader, TableRow } from '@aragon/ui'
import VoteRow from './VoteRow'

const VotesTable = ({ votes, opened, onSelectVote, app }) => (
  <Table
    header={
      <TableRow>
        <TableHeader title="Description" />
        <TableHeader title={'Results'} />
        <TableHeader title="Participation" align="right" />
        <TableHeader title={opened ? 'Time Remaining' : 'Status'} />
      </TableRow>
    }
  >
    {votes
      .sort(
        (
          { data: { startDate: startDateLeft } },
          { data: { startDate: startDateRight } }
        ) =>
          // Sort by date descending
          compareDesc(startDateLeft, startDateRight)
      )
      .map(vote => (
        <VoteRow key={vote.voteId} vote={vote} onSelectVote={onSelectVote} app={app} />
      ))}
  </Table>
)

VotesTable.propTypes = {
  app: PropTypes.object,
  onSelectVote: PropTypes.func.isRequired,
  opened: PropTypes.bool.isRequired,
  votes: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default VotesTable
