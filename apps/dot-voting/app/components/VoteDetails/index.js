import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { BigNumber } from 'bignumber.js'
import { Box, Button, GU, Split, Text, textStyle } from '@aragon/ui'
import { useAragonApi, useNetwork } from '../../api-react'
import { first } from 'rxjs/operators' // Make sure observables have .first
import { LocalIdentityBadge } from '../../../../../shared/identity'
import AppBadge from './AppBadge'
import Status from './Status'
import VotingResults from './VotingResults'
import CastVote from './CastVote'
import Participation from './Participation'
import Label from './Label'
import tokenDecimalsAbi from '../../abi/token-decimals.json'

const tokenAbi = [].concat(tokenDecimalsAbi)

const VoteDetails = ({ vote, onVote }) => {
  const { api, appState: { tokenAddress = '' }, connectedAccount } = useAragonApi()
  const [ votingMode, setVotingMode ] = useState(false)
  const [ voteWeights, setVoteWeights ] = useState([])
  const [ canIVote, setCanIVote ] = useState(false)
  const [ decimals, setDecimals ] = useState(0)
  const toggleVotingMode = () => setVotingMode(!votingMode)
  const { description, voteId } = vote
  const {
    creator,
    type,
  } = vote.data

  const network = useNetwork()

  const getTokenContract = tokenAddress =>
    tokenAddress && api.external(tokenAddress, tokenAbi)

  const tokenContract = getTokenContract(tokenAddress)

  useEffect(() => {
    async function getVoteWeights() {
      const result = await api
        .call('getVoterState', voteId, connectedAccount)
        .toPromise()

      const totalVotesCount = result.reduce(
        (acc, vote) => acc.plus(vote),
        new BigNumber(0)
      )
      const voteWeights = result.map(e =>
        BigNumber(e)
          .div(totalVotesCount)
          .times(100)
          .dp(2)
          .toString()
      )
      setVoteWeights(voteWeights)
    }

    function canIVote() {
      if (connectedAccount && vote) {
        api
          .call('canVote', voteId, connectedAccount)
          .pipe(first())
          .subscribe(canVote => {
            setCanIVote(canVote)
          })
      }
    }

    function loadDecimals() {
      if (tokenContract && connectedAccount) {
        tokenContract.decimals()
          .subscribe(decimals => {
            setDecimals(decimals)
          })
      }
    }

    getVoteWeights()
    canIVote()
    loadDecimals()
  }, [ vote, connectedAccount ])


  // eslint-disable-next-line react/prop-types
  const youVoted = voteWeights.length > 0

  return (
    <Split
      primary={
        <Box>
          <div css={`
            > :not(:last-child) {
              margin-bottom: ${3 * GU}px;
            }
          `}>
            <AppBadge
              type={type}
              youVoted={youVoted}
            />
            <h2 css={textStyle('title2')}>
              {description}
            </h2>
            <div css="display: flex; align-items: baseline">
              <Label>
                Created By
              </Label>
              <div css={`margin-left: ${GU}px`}>
                <LocalIdentityBadge
                  networkType={network.type}
                  entity={creator}
                  shorten
                />
              </div>
            </div>

            {type === 'allocation' && (
              <React.Fragment>
                <Label>
                  Amount
                </Label>
                <Text.Block size="large">
                  {
                    BigNumber(vote.data.balance)
                      .div(BigNumber(10 ** decimals))
                      .toString()
                  } {vote.data.tokenSymbol}
                </Text.Block>
              </React.Fragment>
            )}

            {!votingMode && vote.open && canIVote && (
              <Button mode="strong" onClick={toggleVotingMode}>
                {youVoted ? 'Change vote' : 'Vote'}
              </Button>
            )}

            {votingMode ? (
              <CastVote
                onVote={onVote}
                toggleVotingMode={toggleVotingMode}
                connectedAccount={connectedAccount}
                vote={vote}
                voteWeights={voteWeights}
              />
            ) :(
              <VotingResults
                vote={vote}
                options={vote.data.options}
                voteWeights={voteWeights}
              />
            )}
          </div>
        </Box>
      }
      secondary={
        <React.Fragment>
          <Participation vote={vote} />
          <Status vote={vote} />
        </React.Fragment>
      }
    />
  )
}

VoteDetails.propTypes = {
  vote: PropTypes.object.isRequired,
  onVote: PropTypes.func.isRequired,
}

export default VoteDetails
