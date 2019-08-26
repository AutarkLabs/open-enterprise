import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { BigNumber } from 'bignumber.js'
import {
  Box,
  Button,
  GU,
  Split,
  Text,
  useTheme,
} from '@aragon/ui'
import { first } from 'rxjs/operators' // Make sure observables have .first
import VotingOption from '../VotingOption'
import { Spring, config as springs } from 'react-spring'
import AppBadge from './AppBadge'
import Status from './Status'
import Title from './Title'
import DescriptionAndCreator from './DescriptionAndCreator'
import VotingResults from './VotingResults'
import CastVote from './CastVote'

const VoteDetails = ({ app, vote, userAccount, onVote, minParticipationPct }) => {
  const theme = useTheme()
  const [ votingMode, setVotingMode ] = useState(false)
  const [ voteWeights, setVoteWeights ] = useState([])
  const [ canIVote, setCanIVote ] = useState(false)
  const toggleVotingMode = () => setVotingMode(!votingMode)
  const { description, voteId } = vote
  const {
    metadata: question,
    participationPct,
    creator,
    options,
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

  const Participation = ({ participationPct, minParticipationPct }) => (
    <Box heading="Participation">
      <div css="margin-bottom: 10px">
        {Math.round(participationPct)}%{' '}
        <Text size="small" color={`${theme.surfaceContentSecondary}`}>
          ({minParticipationPct}% needed)
        </Text>
      </div>

      <Spring
        delay={500}
        config={springs.stiff}
        from={{ value: 0 }}
        to={{ value: participationPct / 100 }}
        native
      >
        {({ value }) => (
          <VotingOption
            valueSpring={value}
            color={`${theme.positive}`}
            value={value}
            threshold={minParticipationPct}
          />
        )}
      </Spring>
    </Box>
  )

  Participation.propTypes = {
    participationPct: PropTypes.number.isRequired,
    minParticipationPct: PropTypes.number.isRequired,
  }

  let totalSupport = 0
  // eslint-disable-next-line react/prop-types
  options.forEach(option => {
    totalSupport = totalSupport + parseFloat(option.value, 10)
  })

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
                vote={vote}
                voteWeights={voteWeights}
              />
            ) :(
              <VotingResults
                vote={vote}
                options={options}
                totalSupport={totalSupport}
                voteWeights={voteWeights}
              />
            )}
          </div>
        </Box>
      }
      secondary={
        <React.Fragment>
          <Participation participationPct={participationPct} minParticipationPct={minParticipationPct} />
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
  minParticipationPct: PropTypes.number.isRequired,
}

export default VoteDetails
