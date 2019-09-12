import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Badge,
  Card,
  GU,
  IconCheck,
  Timer,
  textStyle,
  useTheme,
} from '@aragon/ui'
import VotingOptions from './VotingOptions'
import VoteStatus from './VoteStatus'
import { GenerateBadge } from '../utils/vote-styled-components'
import { BigNumber } from 'bignumber.js'

function noop() {}

const VotingCard = ({ app, vote, onSelectVote, userAccount }) => {
  const theme = useTheme()
  const [ voteWeights, setVoteWeights ] = useState([])
  const { description, endDate, open, totalSupport, voteId, support } = vote
  const {
    options,
    totalVoters,
    type,
  } = vote.data

  const handleOpen = useCallback(() => {
    onSelectVote(voteId)
  }, [ voteId, onSelectVote ])

  useEffect(() => {
    async function getVoterState() {
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

    getVoterState()
  }, [userAccount])

  let youVoted = voteWeights.length > 0

  return (
    <Card
      onClick={handleOpen}
      css={`
        height 350px;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: 28px 90px auto 24px;
        grid-gap: 12px;
        padding: ${3 * GU}px;
        align-items: start;
      `}
    >
      <div
        css={`
          display: flex;
          justify-content: space-between;
        `}
      >
        <GenerateBadge type={type} />

        {youVoted && (
          <div
            css={`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: ${theme.infoSurface.alpha(0.08)};
              color: ${theme.info};
            `}
          >
            <IconCheck size="tiny" />
          </div>
        )}
      </div>
      <div
        css={`
          ${textStyle('body1')};
          height: ${28 * 3}px;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
          overflow: hidden;
        `}
      >
        {description}
      </div>

      <div css="width: 100%">
        {options.length > 2 ? (
          <React.Fragment>
            <VotingOptions
              options={options.slice(0, 2)}
              totalSupport={totalSupport}
              color={`${theme.accent}`}
              voteWeights={voteWeights}
            />

            <div css="text-align: center; width: 100%; margin-top: 10px">
              <Badge
                shape="compact"
                foreground={`${theme.surfaceOpened}`}
                background={`${theme.surfaceUnder}`}
                css={`
                  cursor: pointer;
                  padding: 2px 8px;
                  pointer-events: auto;
                `}
              >
                {' + ' + (options.length - 2) + ' more'}
              </Badge>
            </div>
          </React.Fragment>
        ) : (
          <VotingOptions options={options} totalSupport={totalSupport} color={`${theme.accent}`} />
        )}
      </div>

      <div>
        {open ? (
          <Timer end={endDate} maxUnits={4} />
        ) : (
          <VoteStatus
            vote={vote}
            support={support}
            tokenSupply={totalVoters}
          />
        )}
      </div>
    </Card>
  )
}

VotingCard.propTypes = {
  app: PropTypes.object,
  vote: PropTypes.object.isRequired,
  onSelectVote: PropTypes.func.isRequired,
  userAccount: PropTypes.string.isRequired,
}

VotingCard.defaultProps = {
  onSelectVote: noop,
}

export default VotingCard
