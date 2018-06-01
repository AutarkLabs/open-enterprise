import React from 'react'
import styled from 'styled-components'
import { Button, Countdown, TableCell, TableRow } from '@aragon/ui'
import ProgressBar from './ProgressBar'
import VoteStatus from './VoteStatus'
import { safeDiv } from '../utils/math-utils'

class VoteRow extends React.Component {
  static defaultProps = {
    onSelectVote: () => {},
  }

  handleVoteClick = () => {
    this.props.onSelectVote(this.props.vote.voteId)
  }
  render() {
    const { vote } = this.props
    const { endDate, open } = vote
    const { metadata: question, description, totalVoters, candidates } = vote.data

    var totalSupport = 0
    for(var k in candidates) {
        //console.log ('k: ' + k + ', v: ' + candidates[k])
        totalSupport += candidates[k]
    }
    var bars = []
    for(var candidateName in candidates) {
      bars.push (
        <Bar key={candidateName}>
          <ProgressBar
            progress={safeDiv(candidates[candidateName], totalSupport)}
            candidateName={ candidateName }
          />
        </Bar>
      )
    }

    return (
      <TableRow>
        <StatusCell>
          {open ? <Countdown end={endDate} /> : <VoteStatus vote={vote} />}
        </StatusCell>
        <QuestionCell>
          <div>
            {question && (
              <QuestionWrapper>
                {description ? <strong>{question}</strong> : question}
              </QuestionWrapper>
            )}
            {description && (
              <DescriptionWrapper>{description}</DescriptionWrapper>
            )}
          </div>
        </QuestionCell>
        <Cell align="right">{ totalVoters } ({Math.round(totalVoters) / 100}%)</Cell>
        <BarsCell>
          <BarsGroup>
	  { bars }
          </BarsGroup>
        </BarsCell>
        <ActionsCell>
          <Button mode="outline" onClick={this.handleVoteClick}>
            View Vote
          </Button>
        </ActionsCell>
      </TableRow>
    )
  }
}

const Cell = styled(TableCell)`
  vertical-align: top;
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
    margin-top: 20px;
  }
`

export default VoteRow
