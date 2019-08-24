import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import {
  Badge,
  Button,
  Card,
  Countdown,
  Text,
  theme,
} from '@aragon/ui'
import ProgressBar from '../ProgressBar'
import VoteStatus from '../VoteStatus'
import { VOTE_STATUS_SUCCESSFUL } from '../../utils/vote-types'
import { getVoteStatus } from '../../utils/vote-utils'
import { safeDiv } from '../../utils/math-utils'
import { format } from 'date-fns'

const generateBadge = (foreground, background, text) => (
  <Badge foreground={foreground} background={background}>
    {text}
  </Badge>
)

class Vote extends React.Component {
  static propTypes = {
    app: PropTypes.object
  }

  static defaultProps = {
    onSelectVote: () => {},
  }

  state = {
    showMore: false,
  }

  handleVoteClick = () => {
    this.props.onSelectVote(this.props.vote)
  }

  handleExecuteVote = () => {
    this.props.app.executeVote(this.props.vote.voteId)
  }


  render() {
    const { showMore } = this.state
    const { vote } = this.props
    const { endDate, open, totalSupport } = vote
    const {
      metadata: question,
      description,
      options,
      participationPct,
      type,
    } = vote.data

    let typeBadge
    if (type === 'allocation') {
      typeBadge = generateBadge('#AF499AFF', '#AF499A33', 'Allocation')
    } else if (type === 'curation') {
      typeBadge = generateBadge('#4B5EBFFF', '#4B5EBF33', 'Issue Curation')
    } else if (type === 'informational') {
      typeBadge = generateBadge('#C1B95BFF', '#C1B95B33', 'Informational')
    }

    return (
      <StyledCard onClick={this.handleVoteClick} css="cursor: pointer">
        <div>
          {question && (
            <QuestionWrapper>
              {description ? <strong>{question}</strong> : question}
            </QuestionWrapper>
          )}
        </div>
        <div css="display: flex; justify-content: space-between">
          {typeBadge}
          <Text size="xsmall" color={theme.textSecondary}>
            {participationPct.toFixed(2)}% Participation
          </Text>
        </div>

        <Separator />

        <Bars>
          {showMore &&
            options.map(option => (
              <Bar key={option.label}>
                <ProgressBar
                  progress={safeDiv(parseInt(option.value, 10), totalSupport)}
                  label={option.label}
                />
              </Bar>
            ))}
          {!showMore &&
            options.slice(0, 2).map(option => (
              <Bar key={option.label}>
                <ProgressBar
                  progress={safeDiv(parseInt(option.value, 10), totalSupport)}
                  label={option.label}
                />
              </Bar>
            ))}
          {options.length > 2 && (
            <div css="text-align: center; width: 100%">
              <Badge
                shape="compact"
                background={theme.badgeInfoBackground}
                foreground={theme.badgeInfoForeground}
                style={{
                  cursor: 'pointer',
                  padding: '2px 8px',
                  pointerEvents: 'auto',
                  margin: '0 auto',
                }}
                onClick={e => {
                  this.setState({ showMore: !showMore })
                  e.stopPropagation()
                }
                }>
                {showMore
                  ? 'Show less...'
                  : ' + ' + (options.length - 2) + ' more'}
              </Badge>
            </div>
          )}
        </Bars>

        <Separator />

        {open ?
          <div css="text-align: center; width: 100%">
            <Countdown end={endDate} />
          </div>
          :
          (
            <React.Fragment>
              <Status>
                <FieldTitle>Status</FieldTitle>
                <VoteStatus vote={vote} />
              </Status>
              <Status>
                <FieldTitle>End date</FieldTitle>
                <span>{format(endDate, 'MMM DD YYYY HH:mm')}</span>
              </Status>
            </React.Fragment>
          )}

        {!open && getVoteStatus(vote) === VOTE_STATUS_SUCCESSFUL && (
          <div css="text-align: center; width: 100%">
            <Separator />
            <Button
              style={{ margin: '0 auto' }}
              mode="outline"
              onClick={this.handleExecuteVote}
            >
              Execute Vote
            </Button>
          </div>
        )}
      </StyledCard>
    )
  }
}

Vote.propTypes = {
  vote: PropTypes.object.isRequired,
  onSelectVote: PropTypes.func.isRequired,
}

const StyledCard = styled(Card)`
  margin: 0 0 8px 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 16px 8px 16px;
  background: #fff;
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
  width: 100%;
`
const QuestionWrapper = styled(Text.Block).attrs({
  size: 'large',
})`
  margin-bottom: 10px;
  text-align: left;
  color: ${theme.textPrimary};
  display: block;
  /* stylelint-disable value-no-vendor-prefix, property-no-vendor-prefix */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  /* stylelint-enable */
  overflow: hidden;
  text-overflow: ellipsis;
`
const Status = styled.div`
  width: 100%;
  display: flex;
  justify-content: stretch;
  align-items: center;
  padding: 4px 0;
`
const Bars = styled.div`
  width: 100%;
  min-width: 190px;
  cursor: auto;
`
const Bar = styled.div`
  &:not(:first-child) {
    margin-top: 0.5rem;
  }
`
const Separator = styled.hr`
  height: 1px;
  border: 0;
  width: 100%;
  margin: 14px 0;
  background: ${theme.contentBorder};
`
// TODO: extract to shared/ui
// See https://github.com/AutarkLabs/planning-suite/issues/382
const FieldTitle = styled(Text.Block)`
  color: ${theme.textSecondary};
  text-transform: lowercase;
  font-variant: small-caps;
  font-weight: bold;
  text-align: right;
  padding-right: 20px;
  width: 35%;
`

// eslint-disable-next-line import/no-unused-modules
export default Vote
