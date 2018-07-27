import React from 'react'
import { compareDesc } from 'date-fns'
import { Table, TableHeader, TableRow } from '@aragon/ui'
import VoteRow from './VoteRow'

const VotesTable = ({ votes, opened, onSelectVote }) => (
  <Table
    header={
      <TableRow>
        <TableHeader title={opened ? 'Time Remaining' : 'Status'} />
        <TableHeader title="Question" />
        <TableHeader title="Participation" align="right" />
        <TableHeader title={'Results'} />
        <TableHeader title="Actions" />
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
        <VoteRow key={vote.voteId} vote={vote} onSelectVote={onSelectVote} />
      ))}
  </Table>
)

export default VotesTable
