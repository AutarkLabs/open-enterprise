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
import BigNumber  from 'bignumber.js'

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
  render() {
    const { showMore } = this.state
    const { vote } = this.props
    const { endDate, open } = vote
    const {
      metadata: question,
      description,
      candidates,
      options,
      participationPct,
      type,
    } = vote.data
    let totalSupport = BigNumber(0)
    // Couldn't get this working with a reducer :[
    options.forEach(option => {
      totalSupport = totalSupport.plus(BigNumber(option.value))
    })

    let optionProgress = 0
    let optionsFill = options.map( option => {
      console.log(option.value)
      if(option.value === 0){
        return {label: option.label, progress: 0}        
      }
      optionProgress = BigNumber(option.value).times(BigNumber(100.00)).div(BigNumber(totalSupport)).toNumber();
      console.log(optionProgress)
      optionProgress = optionProgress / 100;
      console.log(optionProgress)
      return {label: option.label, progress: parseFloat(optionProgress)}
    })

    console.log(optionsFill)

    // TODO: Hardcode colors into constants or extend aragon ui theme if needed
    let typeBadge
    if (type === 'allocation') {
      typeBadge = generateBadge('#AF499A', '#EED3F4', 'Allocation')
    } else if (type === 'curation') {
      typeBadge = generateBadge('#4B5EBF', '#9FD2F1', 'Curation')
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
        <Cell align="right" onClick={this.handleVoteClick}>
          {parseFloat(participationPct.toFixed(2))}%
        </Cell>
        <BarsCell>
          <BarsGroup>
            {showMore && optionsFill.map(option => (
              <Bar key={option.label}>
                <ProgressBar
                  progress={option.optionProgress}
                  label={option.label}
                />
              </Bar>
            ))}
            {!showMore && optionsFill.slice(0,2).map(option => (
              <Bar key={option.label}>
                <ProgressBar
                  progress={option.optionProgress}
                  label={option.label}
                />
              </Bar>
            ))}
            {options.length > 2 && (
              <ShowMoreText
                onClick={() => this.setState({ showMore: !showMore })}
              >
                {showMore
                  ? 'Show less options...'
                  : options.length - 2 + ' more options...'}
              </ShowMoreText>
            )}
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
    margin-top: 0.5rem;
  }
`

const ShowMoreText = styled.p`
  font-size: 12px;
  color: ${theme.textTertiary};
  font-style: italic;
  margin-top: 0.5rem;
  cursor: pointer;
  pointer-events: auto;
`

export default VoteRow
