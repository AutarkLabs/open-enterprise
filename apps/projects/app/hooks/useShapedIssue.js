import { useCallback, useMemo } from 'react'
import { useAragonApi } from '../api-react'
import BigNumber from 'bignumber.js'

export default () => {
  const { appState } = useAragonApi()
  const { bountySettings = {} } = appState

  const bounties = useMemo(() => (appState.issues || []).reduce(
    (obj, i) => { obj[i.issueId] = i; return obj },
    {}
  ), [appState.issues])

  const tokens = useMemo(() => (appState.tokens || []).reduce(
    (obj, t) => { obj[t.addr] = t; return obj },
    {}
  ), [appState.tokens])

  const shapeIssue = useCallback(issue => {
    const bounty = bounties[issue.id]
    const repoIdFromBounty = bounty && bounty.data.repoId
    if ((bounty && tokens[bounty.data.token]) && repoIdFromBounty === issue.repository.id) {
      const data = bounties[issue.id].data
      const balance = BigNumber(bounties[issue.id].data.balance)
        .plus(bounties[issue.id].data.fulfilled || 0)
        .div(BigNumber(10 ** tokens[data.token].decimals))
        .dp(3)
        .toString()
      
      const fulfilled = BigNumber(bounties[issue.id].data.fulfilled)
        .div(BigNumber(10 ** tokens[data.token].decimals))
        .dp(3)
        .toString()

      return {
        ...issue,
        ...bounties[issue.id].data,
        repoId: issue.repository.decoupled ? issue.repository.hexId : issue.repository.id,
        repo: issue.repository.name,
        symbol: tokens[data.token].symbol,
        expLevel: bountySettings.expLvls[data.exp].name,
        balance,
        fulfilled,
        data,
      }
    }
    return {
      ...issue,
      repoId: issue.repository.decoupled ? issue.repository.hexId : issue.repository.id,
      repo: issue.repository.name,
    }
  }, [ bounties, bountySettings.expLvls, tokens ])

  return shapeIssue
}
