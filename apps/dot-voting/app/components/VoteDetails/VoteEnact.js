import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { useAragonApi } from '@aragon/api-react'
import { Button, Info } from '@aragon/ui'

const VoteEnact = ({ voteId, setCurrentVoteId }) => {
  const { api } = useAragonApi()

  const handleExecuteVote = useCallback(async () => {
    await api.executeVote(voteId).toPromise()
    setCurrentVoteId(-1)
  }, [ api, voteId ])

  return (
    <div>
      <Button
        mode="strong"
        wide
        onClick={handleExecuteVote}
        css="margin: 10px 0"
      >
          Execute Vote
      </Button>
      <Info>
        The voting period is closed and the vote status is passed. <span css="font-weight: bold">Anyone</span> can now enact this vote to execute its action.
      </Info>
    </div>
  )
}

VoteEnact.propTypes = {
  voteId: PropTypes.string.isRequired,
  setCurrentVoteId: PropTypes.func.isRequired,
}

export default VoteEnact
