import React from 'react'
import styled from 'styled-components'
import {
  Button,
  Countdown,
  TableCell,
  TableRow,
  Badge,
  theme,
} from '@aragon/ui'
import ProgressBar from './ProgressBar'
import VoteStatus from './VoteStatus'
import { safeDiv } from '../utils/math-utils'
import BigNumber from 'bignumber.js'
import { VOTE_STATUS_SUCCESSFUL } from '../utils/vote-types'
import { getVoteStatus } from '../utils/vote-utils'

const generateBadge = (foreground, background, text) => (
  <Badge foreground={foreground} background={background}>
    {text}
  </Badge>
)

class VoteRow extends React.Component {
  static defaultProps = {
    onSelectVote: () => {},
  }

  state = {
    showMore: false,
  }

  handleVoteClick = () => {
    this.props.onSelectVote(this.props.vote.voteId)
  }

  handleExecuteVote = e => {
    this.props.app.executeVote(this.props.vote.voteId)
    e.stopPropagation()
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

    // TODO: Hardcode colors into constants or extend aragon ui theme if needed
    let typeBadge
    if (type === 'allocation') {
      typeBadge = generateBadge('#AF499AFF', '#AF499A33', 'Allocation')
    } else if (type === 'curation') {
      typeBadge = generateBadge('#4B5EBFFF', '#4B5EBF33', 'Issue Curation')
    } else if (type === 'informational') {
      typeBadge = generateBadge('#C1B95BFF', '#C1B95B33', 'Informational')
    }

    return (
      <TableRow>
        <QuestionCell onClick={this.handleVoteClick}>
          <div>
            {question && (
              <QuestionWrapper>
                {description ? <strong>{question}</strong> : question}
              </QuestionWrapper>
            )}
            {typeBadge}
          </div>
        </QuestionCell>
        <BarsCell>
          <BarsGroup>
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
              <Badge
                shape="compact"
                background={theme.badgeInfoBackground}
                foreground={theme.badgeInfoForeground}
                style={{
                  cursor: 'pointer',
                  padding: '2px 8px',
                  pointerEvents: 'auto',
                }}
                onClick={() => this.setState({ showMore: !showMore })}
              >
                {showMore
                  ? 'Show less...'
                  : ' + ' + (options.length - 2) + ' more'}
              </Badge>
            )}
          </BarsGroup>
        </BarsCell>
        <Cell align="right" onClick={this.handleVoteClick}>
          {participationPct.toFixed(2)}%
        </Cell>
        <StatusCell onClick={this.handleVoteClick}>
          <div>
            <div>
              {open ? <Countdown end={endDate} /> : <VoteStatus vote={vote} />}
            </div>
            {!open &&
              getVoteStatus(vote) === VOTE_STATUS_SUCCESSFUL && (
              <div>
                <Button
                  style={{ marginTop: '20px' }}
                  mode="outline"
                  wide
                  onClick={this.handleExecuteVote}
                >
                    Execute Vote
                </Button>
              </div>
            )}
          </div>
        </StatusCell>
      </TableRow>
    )
  }
}

const Cell = styled(TableCell)`
  vertical-align: top;
  cursor: pointer;
`
const StatusCell = styled(Cell)`
  vertical-align: top;
  width: 180px;
`
const QuestionCell = styled(Cell)`
  width: 40%;
`
const BarsCell = styled(Cell)`
  flex-shrink: 0;
  width: 25%;
  min-width: 190px;
  cursor: auto;
`
const QuestionWrapper = styled.p`
  margin-right: 20px;
  margin-bottom: 4px;
  hyphens: auto;
  font-size: 1.2em;
`
const BarsGroup = styled.div`
  width: 100%;
`
const Bar = styled.div`
  &:not(:first-child) {
    margin-top: 0.5rem;
  }
`

export default VoteRow
