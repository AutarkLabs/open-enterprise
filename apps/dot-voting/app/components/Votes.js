import React from 'react'
import PropTypes from 'prop-types'
import VotingCardGroup from './VotingCardGroup'
import VotingCard from './VotingCard'

const Votes = ({ app, votes, onSelectVote, userAccount }) => {

  const openedVotes = votes.filter(({ open }) => open)
  const closedVotes = votes.filter(({ open }) => !open)

  const votingGroups = [
    [ 'Open votes', openedVotes ],
    [ 'Past votes', closedVotes ],
  ]

  return votingGroups.map(([ groupName, votes ]) =>
    !!votes.length && (
      <VotingCardGroup
        title={groupName}
        count={votes.length}
        key={groupName}
      >
        {votes.map(vote => (
          <VotingCard
            key={vote.voteId}
            app={app}
            vote={vote}
            onSelectVote={onSelectVote}
            userAccount={userAccount}
          />
        ))}
      </VotingCardGroup>
    )
  )
}

Votes.propTypes = {
  app: PropTypes.object,
  onSelectVote: PropTypes.func.isRequired,
  votes: PropTypes.arrayOf(PropTypes.object).isRequired,
  userAccount: PropTypes.string.isRequired,
}

export default Votes
