import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Badge,
  Button,
  Card,
  GU,
  IconCheck,
  Timer,
  textStyle,
  useTheme,
} from '@aragon/ui'
import VotingOptions from './VotingOptions'
import { VOTE_STATUS_SUCCESSFUL } from '../utils/vote-types'
import { getVoteStatus } from '../utils/vote-utils'
import VoteStatus from './VoteStatus'

function noop() {}

const badgeDetails = {
  'allocation': { fg: '#AF499AFF', bg: '#AF499A33', text: 'Allocation' },
  'curation': { fg: '#4B5EBFFF', bg: '#4B5EBF33', text: 'Issue Curation' },
  'informational': { fg: '#C1B95BFF', bg: '#C1B95B33', text: 'Informational' },
}

const generateBadge = type => (
  <Badge.App foreground={badgeDetails[type].fg} background={badgeDetails[type].bg}>
    {badgeDetails[type].text}
  </Badge.App>
)

const VotingCard = ({ app, vote, onSelectVote }) => {
  const theme = useTheme()
  const { endDate, open, totalSupport, voteId, support, userBalance } = vote
  const {
    metadata: question,
    description,
    options,
    totalVoters,
    participationPct,
    type,
  } = vote.data

  const handleExecuteVote = e => {
    app.executeVote(this.props.vote.voteId)
    e.stopPropagation()
  }

  const youVoted = false

  const handleOpen = useCallback(() => {
    onSelectVote(voteId)
  }, [ voteId, onSelectVote ])
  const [ showMore, setShowMore ] = useState(false)
  const toggleShowMore = () => setShowMore(!showMore)

  return (
    <Card
      onClick={handleOpen}
      css={`
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr auto auto;
        grid-gap: 8px;
        padding: ${3 * GU}px;
      `}
    >
      <div
        css={`
          display: flex;
          justify-content: space-between;
        `}
      >
        {generateBadge(type)}

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
          height: 56px;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        `}
      >
        <span css="font-weight: bold">#{voteId}</span>{' '}
        {question && (
          description ? <strong>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
            {question}</strong> : question + 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.'

        )}
      </div>

      <div css="width: 100%">
        {showMore ? (
          <VotingOptions options={options} totalSupport={totalSupport} />
        ) : (
          <React.Fragment>

            <VotingOptions options={options.slice(0, 2)} totalSupport={totalSupport} />

            {options.length > 2 && (
              <div css="text-align: center; width: 100%; padding: 4px">

                <Badge
                  shape="compact"
                  css={`
                  cursor: pointer;
                  padding: 2px 8px;
                  pointer-events: auto;
                  color: ${theme.surfaceOpened}
                  background-color: ${theme.surfaceUnder}
                  `}
                  onClick={toggleShowMore}
                >
                  {showMore
                    ? 'Show less...'
                    : ' + ' + (options.length - 2) + ' more'}
                </Badge>
              </div>
            )}
          </React.Fragment>
        )}
      </div>

      <div
        css={`
          margin-top: ${2 * GU}px;
        `}
      >
        {open ? (
          <Timer end={endDate} maxUnits={4} />
        ) : (
          !open && getVoteStatus(vote) === VOTE_STATUS_SUCCESSFUL ? (
            <div>
              <Button
                mode="outline"
                wide
                onClick={handleExecuteVote}
              >
                  Execute Vote
              </Button>
            </div>
          ) : (
            <VoteStatus
              vote={vote}
              support={support}
              tokenSupply={totalVoters}
            />

          )
        )}
      </div>
    </Card>
  )
}

VotingCard.propTypes = {
  app: PropTypes.object,
  vote: PropTypes.object.isRequired,
  onSelectVote: PropTypes.func.isRequired
}

VotingCard.defaultProps = {
  onSelectVote: noop,
}

export default VotingCard
