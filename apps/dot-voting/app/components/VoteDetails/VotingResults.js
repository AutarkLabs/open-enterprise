import React from 'react'
import PropTypes from 'prop-types'
import { useTheme } from '@aragon/ui'
import { getVoteStatus } from '../../utils/vote-utils'
import { VOTE_STATUS_SUCCESSFUL } from '../../utils/vote-types'
import VotingOptions from '../VotingOptions'
import Label from './Label'
import VoteEnact from './VoteEnact'

const VotingResults = ({ vote, options, totalSupport, voteWeights }) => {
  const theme = useTheme()
  return (
    <React.Fragment>
      <Label>
        Current Results
      </Label>
      <div>
        <VotingOptions
          options={options}
          totalSupport={totalSupport}
          color={`${theme.accent}`}
          voteWeights={voteWeights}
        />
      </div>
      {!vote.open && getVoteStatus(vote) === VOTE_STATUS_SUCCESSFUL && <VoteEnact voteId={vote.voteId} />}
    </React.Fragment>
  )
}

VotingResults.propTypes = {
  vote: PropTypes.object.isRequired,
  options: PropTypes.PropTypes.arrayOf(PropTypes.object).isRequired,
  totalSupport: PropTypes.number.isRequired,
  voteWeights: PropTypes.PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default VotingResults
