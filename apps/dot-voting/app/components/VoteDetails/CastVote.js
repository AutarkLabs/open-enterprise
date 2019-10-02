import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, Text, useTheme } from '@aragon/ui'
import Slider from '../Slider'
import Label from './Label'
import { BN } from 'web3-utils'

const ValueContainer = styled.div`
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
  border-radius: 3px;
  width: 69px;
  height: 40px;
  border: 1px solid ${({ theme }) => theme.surfaceIcon};
  padding-top: 0.5rem;
  text-align: center;
`

const SliderAndValueContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`

const CastVote = ({ onVote, toggleVotingMode, vote, voteWeights, votingPower }) => {
  const theme = useTheme()

  const [ remaining, setRemaining ] = useState(100)
  const [ voteOptions, setVoteOptions ] = useState(
    Array.from(Array(vote.data.options.length), () => ({}))
  )

  useEffect(() => {
    if (voteWeights.length) {
      const sliderValues = voteWeights.map(value => ({
        sliderValue: value / 100,
        trueValue: Math.round(value)
      }))
      const total = sliderValues.reduce(
        (sum, { trueValue }) => sum + trueValue,
        0
      )
      setVoteOptions(sliderValues)
      setRemaining(100 - total)
    }
  }, [voteWeights])

  const sliderUpdate = useCallback((value, idx) => {
    const total = voteOptions.reduce(
      (acc, { trueValue }, index) => {
        return (
          acc +
          (idx === index
            ? Math.round(value * 100) || 0
            : trueValue || 0)
        )
      },
      0
    )

    if (total <= 100) {
      voteOptions[idx].sliderValue = value
      voteOptions[idx].trueValue = Math.round(value * 100)
      setRemaining(100 - total)
      setVoteOptions([...voteOptions])
    }
  }, [voteOptions])

  const handleVoteSubmit = useCallback(() => {
    const votingPowerBN = new BN(votingPower, 10)
    const optionsArray = voteOptions.map(element => {
      const baseValue = element.trueValue ? new BN(element.trueValue, 10) : new BN('0', 10)
      const voteWeight = baseValue.mul(votingPowerBN).div(new BN('100', 10))
      return voteWeight.toString(10)
    })
    onVote(vote.voteId, optionsArray)
  }, [ vote.voteId, onVote, votingPower, voteOptions ])

  return (
    <div css="width: 100%">
      <div css="display: flex; justify-content: space-between">
        <Label>Your vote</Label>
        <Label>Percentage</Label>
      </div>

      {voteOptions.map((option, index) => (
        <div key={index}>
          <SliderAndValueContainer>
            <Text size="small" css="width: 100%">{vote.data.options[index].label}</Text>
            <div css={`
              display: flex;
              margin: 0.5rem 0 1rem 0;
              justify-content: space-between;
              width: 100%;
            `}>
              <Slider
                value={option.sliderValue}
                onUpdate={value => sliderUpdate(value, index)}
              />
              <ValueContainer theme={theme}>
                {option.trueValue || 0}
              </ValueContainer>
            </div>
          </SliderAndValueContainer>
        </div>
      ))}

      <Text.Block
        size="small"
        color={`${theme.surfaceContentSecondary}`}

      >
        <span css="font-weight: bold; float: right">
          You have <span css={`color: ${theme.accent}`}>{remaining}</span> dots remaining
        </span>
      </Text.Block>

      <div css="display: flex; justify-content: flex-end; align-items: center; width: 100%">
        <Button onClick={toggleVotingMode}>
          Cancel
        </Button>
        <Button
          css="margin: 1rem 0 1rem 0.5rem"
          mode="strong"
          onClick={handleVoteSubmit}
          disabled={
            voteOptions.reduce((sum, { trueValue = 0 }) => sum + parseInt(trueValue, 10), 0) === 0
          }
        >
          Submit Vote
        </Button>
      </div>
    </div>
  )
}

CastVote.propTypes = {
  onVote: PropTypes.func.isRequired,
  toggleVotingMode: PropTypes.func.isRequired,
  vote: PropTypes.shape({
    data: PropTypes.shape({
      options: PropTypes.PropTypes.arrayOf(PropTypes.object).isRequired,
      snapshotBlock: PropTypes.number.isRequired,
    }).isRequired,
    voteId: PropTypes.string.isRequired,
  }).isRequired,
  voteWeights: PropTypes.array.isRequired,
  votingPower: PropTypes.string.isRequired,
}

export default CastVote
