import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { BigNumber } from 'bignumber.js'
import { Box, Button, GU, Split } from '@aragon/ui'
import { first } from 'rxjs/operators' // Make sure observables have .first
import AppBadge from './AppBadge'
import Status from './Status'
import Title from './Title'
import DescriptionAndCreator from './DescriptionAndCreator'
import VotingResults from './VotingResults'
import CastVote from './CastVote'
import Participation from './Participation'

const VoteDetails = ({ app, vote, userAccount, onVote }) => {
  const [ votingMode, setVotingMode ] = useState(false)
  const [ voteWeights, setVoteWeights ] = useState([])
  const [ canIVote, setCanIVote ] = useState(false)
  const toggleVotingMode = () => setVotingMode(!votingMode)
  const { description, voteId } = vote
  const {
    metadata: question,
    creator,
    type,
  } = vote.data

  useEffect(() => {
    async function getVoteWeights() {
      const result = await app
        .call('getVoterState', voteId, userAccount)
        .toPromise()

      const totalVotesCount = result.reduce(
        (acc, vote) => acc.plus(vote),
        new BigNumber(0)
      )
      const voteWeights = result.map(e =>
        BigNumber(e)
          .div(totalVotesCount)
          .times(100)
          .dp(2)
          .toString()
      )
      setVoteWeights(voteWeights)
    }

    function canIVote() {
      if (userAccount && vote) {
        app
          .call('canVote', voteId, userAccount)
          .pipe(first())
          .subscribe(canVote => {
            setCanIVote(canVote)
          })
      }
    }

    getVoteWeights()
    canIVote()
  }, [ vote, userAccount ])


  // eslint-disable-next-line react/prop-types
  const youVoted = voteWeights.length > 0

  return (
    <Split
      primary={
        <Box>
          <div css={`
            > :not(:last-child) {
              margin-bottom: ${3 * GU}px;
            }
          `}>
            <AppBadge
              type={type}
              youVoted={youVoted}
            />
            <Title
              question={question}
            />
            <DescriptionAndCreator
              creator={creator}
              question={question}
              description={description}
            />

            {!votingMode && vote.open && canIVote && (
              <Button mode="strong" onClick={toggleVotingMode}>
                {youVoted ? 'Change vote' : 'Vote'}
              </Button>
            )}

            {votingMode ? (
              <CastVote
                onVote={onVote}
                toggleVotingMode={toggleVotingMode}
                userAccount={userAccount}
                vote={vote}
                voteWeights={voteWeights}
              />
            ) :(
              <VotingResults
                vote={vote}
                options={vote.data.options}
                voteWeights={voteWeights}
              />
            )}
          </div>
        </Box>
      }
      secondary={
        <React.Fragment>
          <Participation vote={vote} />
          <Status vote={vote} />
        </React.Fragment>
      }
    />
  )
}

VoteDetails.propTypes = {
  app: PropTypes.object.isRequired,
  userAccount: PropTypes.string.isRequired,
  vote: PropTypes.object.isRequired,
  onVote: PropTypes.func.isRequired,
}

export default VoteDetails
