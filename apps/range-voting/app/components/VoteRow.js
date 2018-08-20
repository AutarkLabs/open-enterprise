import React from 'react'
import styled from 'styled-components'
import { Button, Countdown, TableCell, TableRow, Badge } from '@aragon/ui'
import ProgressBar from './ProgressBar'
import VoteStatus from './VoteStatus'
import { safeDiv } from '../utils/math-utils'

const generateBadge = (foreground, background, text) => (
  <Badge
  foreground={foreground}
  background={background}
  >
    {text}
  </Badge>
)

class VoteRow extends React.Component {
  static defaultProps = {
    onSelectVote: () => {},
  }

  state = {
    showMore: false
  }

  handleVoteClick = () => {
    this.props.onSelectVote(this.props.vote.voteId)
  }
  render() {
    const { showMore } = this.state
    const { vote } = this.props
    const { endDate, open } = vote
    const { metadata: question, description, totalVoters, candidates, options, type } = vote.data

    const totalSupport = options.reduce((acc, option) => acc + option.value, 0)

    const bars = options.map((option) => (
      <Bar key={option.label}>
        <ProgressBar
          progress={safeDiv(option.value, totalSupport)}
          label={ option.label }
        />
      </Bar>
    ))

    let typeBadge
    if (type === 'allocation') {
      typeBadge = generateBadge('#AF499A', '#EED3F4', 'Allocation')
    } else if (type === 'curation') {
      typeBadge = generateBadge('#4B5EBF', '#9FD2F1' , 'Curation')
    } else if (type === 'informational') {
      typeBadge = generateBadge('#C1B95B', '#F1EB9F', 'Informational')
    }

    return (
      <TableRow>
        <StatusCell onClick={this.handleVoteClick}>
          {open ? <Countdown end={endDate} /> : <VoteStatus vote={vote} />}
        </StatusCell>
        <QuestionCell onClick={this.handleVoteClick}>
          <div>
            {question && (
              <QuestionWrapper>
                {description ? <strong>{question}</strong> : question}
              </QuestionWrapper>
            )}
            {description && (
              <DescriptionWrapper>{description}</DescriptionWrapper>
            )}
            {typeBadge}
          </div>
        </QuestionCell>
        <Cell align="right" onClick={this.handleVoteClick}>{totalVoters}%</Cell>
        <BarsCell>
          <BarsGroup>
            { showMore ? bars : [bars[0], bars[1]] }
            <ShowMoreText
              onClick={() => this.setState({ showMore: !showMore})}
            >
              {showMore ? 'Show less options...' : (bars.length - 2 + ' more options...')}
            </ShowMoreText>
          </BarsGroup>
        </BarsCell>
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
  width: 190px;
`

const QuestionCell = styled(Cell)`
  width: 40%;
`

const BarsCell = styled(Cell)`
  flex-shrink: 0;
  width: 25%;
  min-width: 200px;
  cursor: auto;
`

const ActionsCell = styled(Cell)`
  width: 0;
`

const QuestionWrapper = styled.p`
  margin-right: 20px;
  word-break: break-all;
  hyphens: auto;
`

const DescriptionWrapper = styled.p`
  margin-right: 20px;

  ${QuestionWrapper} + & {
    margin-top: 10px;
  }
`

const BarsGroup = styled.div`
  width: 100%;
`

const Bar = styled.div`
  &:not(:first-child) {
    margin-top: .5rem;
  }
`

const ShowMoreText = styled.p`
  font-size: 12px;
  color: #9B9B9B;
  font-style: italic;
  margin-top: .5rem;
  cursor: pointer;
  pointer-events: auto;
`

export default VoteRow
