import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Text, useTheme } from '@aragon/ui'
import Label from '../Label'
import { BN } from 'web3-utils'
import EditVoteOption from './EditVoteOption'

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
            ? Math.round(value) || 0
            : trueValue || 0)
        )
      },
      0
    )

    if (total <= 100) {
      voteOptions[idx].sliderValue = value
      voteOptions[idx].trueValue = Math.round(value)
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
        <EditVoteOption
          key={index}
          onUpdate={sliderUpdate}
          option={option}
          optionIndex={index}
          vote={vote}
        />
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
