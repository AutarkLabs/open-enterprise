import { useEffect, useState } from 'react'
import { BigNumber } from 'bignumber.js'
import { first } from 'rxjs/operators' // Make sure observables have .first
import { useAragonApi } from '../api-react'
import tokenBalanceOfAbi from '../abi/token-balanceof.json'

const tokenAbi = [].concat(tokenBalanceOfAbi)

const useUserVoteStats = vote => {
  const { api, appState: { tokenAddress = '' }, connectedAccount } = useAragonApi()
  const [ voteWeights, setVoteWeights ] = useState([])
  const [ votingPower, setVotingPower ] = useState('0')
  const tokenContract = tokenAddress && api.external(tokenAddress, tokenAbi)

  useEffect(() => {
    if (tokenContract && connectedAccount) {
      tokenContract.balanceOfAt(connectedAccount, vote.data.snapshotBlock)
        .pipe(first())
        .subscribe(userBalance => {
          setVotingPower(userBalance)
        })
    }
  }, [ connectedAccount, tokenContract, vote.data.snapshotBlock ])

  useEffect(() => {
    (async () => {
      const votesPerOption = await api
        .call('getVoterState', vote.voteId, connectedAccount)
        .toPromise()

      setVoteWeights(votesPerOption.map(votes =>
        BigNumber(votes)
          .div(votingPower)
          .times(100)
          .dp(2)
          .toString()
      ))
    })()
  }, [ connectedAccount, vote.voteId, votingPower ])

  return { voteWeights, votingPower }
}

export default useUserVoteStats
