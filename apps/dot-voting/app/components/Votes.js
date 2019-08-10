import React from 'react'
import PropTypes from 'prop-types'
import VotingCardGroup from './VotingCardGroup'
import VotingCard from './VotingCard'

const Votes = ({ votes, onSelectVote, app }) => {

  const openedVotes = votes.filter(({ open }) => open)
  const closedVotes = votes.filter(vote => !openedVotes.includes(vote))

  const votingGroups = [
    [ 'Open votes', openedVotes ],
    [ 'Past votes', closedVotes ],
  ]
  
  return (
    <React.Fragment>

      {votingGroups.map(([ groupName, votes ]) =>
        votes.length ? (
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
              />
            ))}
          </VotingCardGroup>
        ) : null
      )}
    </React.Fragment>
  )
}

Votes.propTypes = {
  app: PropTypes.object,
  onSelectVote: PropTypes.func.isRequired,
  votes: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default Votes
