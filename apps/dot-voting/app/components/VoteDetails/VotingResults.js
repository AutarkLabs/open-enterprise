import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useTheme } from '@aragon/ui'
import { getVoteStatus } from '../../utils/vote-utils'
import { VOTE_STATUS_SUCCESSFUL } from '../../utils/vote-types'
import VotingOptions from '../VotingOptions'
import Label from './Label'
import VoteEnact from './VoteEnact'

const VotingResults = ({ vote, voteWeights, setCurrentVoteId }) => {
  const theme = useTheme()

  const [ totalSupport, setTotalSupport ] = useState(0)
  useEffect(() => {
    setTotalSupport(vote.data.options.reduce(
      (total, option) => total + parseFloat(option.value, 10),
      0
    ))
  }, [vote.data.options])

  return (
    <React.Fragment>
      <Label>
        Current Results
      </Label>
      <div>
        <VotingOptions
          options={vote.data.options}
          totalSupport={totalSupport}
          color={`${theme.accent}`}
          voteWeights={voteWeights}
        />
      </div>
      {!vote.open && getVoteStatus(vote) === VOTE_STATUS_SUCCESSFUL && <VoteEnact voteId={vote.voteId} setCurrentVoteId={setCurrentVoteId} />}
    </React.Fragment>
  )
}

VotingResults.propTypes = {
  vote: PropTypes.object.isRequired,
  voteWeights: PropTypes.PropTypes.arrayOf(PropTypes.string).isRequired,
  setCurrentVoteId: PropTypes.func.isRequired,
}

export default VotingResults
