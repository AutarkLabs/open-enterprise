import React from 'react'
import styled from 'styled-components'
import { Motion, spring } from 'react-motion'
import { SidePanel, Text, theme, spring as springConf } from '@aragon/ui'
import { safeDiv } from '../utils/math-utils'

const { PANEL_INNER_WIDTH } = SidePanel

const fast = springConf('fast')

// consider using:
// https://www.npmjs.com/package/color-scheme

const VoteSummary = ({
  candidates,
  tokenSupply,
  quorum,
  quorumProgress,
  support,
  ready,
}) => {
  
  var totalVotes = 0

  for(var k in candidates) {
    console.log ('k: ' + k + ', v: ' + candidates[k])
    totalVotes += candidates[k]
  }

  var bars = []
  var items = []

//  uint256 public candidateSupportPct; voting power
//  uint256 public minParticipationPct; voters

  for(k in candidates) {
    const votesPct = safeDiv(candidates[k], tokenSupply)
    const votesVotersPct = safeDiv(candidates[k], totalVotes)

bars.push (
		<Votes
                color={theme.accept}
                style={{
                  transform: `scaleX(${votesPct * 10})`,
                }}
              />
     )

items.push (
          <Candidate color={theme.accent}>
            <span>{k}</span>
	    <span>
            <strong>{Math.round(votesVotersPct * 10 * 100)}%</strong>
            <Text size="xsmall" color={theme.textSecondary}>
              ({Math.round(support * 100)}% needed)
            </Text>
	    </span>
          </Candidate>
 	   )
}

  return (
    <Motion
      defaultStyle={{ progress: 0 }}
      style={{ progress: spring(Number(ready), fast) }}
    >
      {({ progress }) => (
        <Main>
          <Header>
            <span>
              <Label>
                Quorum: <strong>{Math.round(quorumProgress * 100)}%</strong>{' '}
              </Label>
              <Text size="xsmall" color={theme.textSecondary}>
                ({Math.round(quorum * 100)}% needed)
              </Text>
            </span>
          </Header>
          <BarWrapper>
            <QuorumBar
              style={{
                transform: `
                translateX(${PANEL_INNER_WIDTH * quorum * progress}px)
                scaleY(${quorum ? progress : 0})
              `,
              }}
            />
            <Bar>
	    { bars }
            </Bar>
          </BarWrapper>
	  { items }
       </Main>
      )}
    </Motion>
  )
}

const Main = styled.div`
  padding: 20px 0;
`

const Header = styled.h2`
  display: flex;
  justify-content: space-between;
`

const Label = styled(Text).attrs({
  smallcaps: true,
  color: theme.textSecondary,
})`
  strong {
    color: #000;
  }
`

const BarWrapper = styled.div`
  position: relative;
  display: flex;
  margin: 10px 0;
  align-items: center;
  height: 50px;
`

const Bar = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 6px;
  border-radius: 2px;
  background: #6d777b;
`

const Votes = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 6px;
  transform-origin: 0 0;
  background: ${({ color }) => color};
`

const QuorumBar = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  border-right: 1px dashed #979797;
`

const Candidate = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  &:first-child {
    margin-bottom: 10px;
  }
  &:before {
    content: '';
    display: block;
    width: 10px;
    height: 10px;
    margin-right: 15px;
    border-radius: 5px;
    background: ${({ color }) => color};
  }
  span:first-child {
    //width: 35px;
    color: ${theme.textSecondary};
  }
  span:last-child {
    margin-left: auto;
  }
  strong {
    margin-right: 10px;
  }
`

export default VoteSummary
