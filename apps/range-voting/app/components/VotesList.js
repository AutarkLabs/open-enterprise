import React from 'react'
import { compareDesc } from 'date-fns'
import { Vote } from './Card'

const VotesList = ({ votes, onSelectVote, app }) => (
  <React.Fragment>
    {votes.sort(
      (
        { data: { startDate: startDateLeft } },
        { data: { startDate: startDateRight } }
      ) =>
        // Sort by date descending
        compareDesc(startDateLeft, startDateRight)
    )
      .map(vote => (
        <Vote key={vote.voteId} vote={vote} onSelectVote={onSelectVote} app={app} />
      ))}
  </React.Fragment>
)

export default VotesList