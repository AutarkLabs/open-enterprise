import { useCallback } from 'react'
import { useAragonApi } from '@aragon/api-react'
import BigNumber from 'bignumber.js'

export default () => {
  const { appState } = useAragonApi()
  const { tokens = [], bountyIssues = [], bountySettings = {} } = appState

  const bountyIssueObj = {}
  const tokenObj = {}
  const expLevels = bountySettings.expLvls

  bountyIssues.forEach(issue => {
    bountyIssueObj[issue.issueNumber] = issue
  })

  tokens.forEach(token => {
    tokenObj[token.addr] = {
      symbol: token.symbol,
      decimals: token.decimals,
    }
  })

  const shapeIssue = useCallback(issue => {
    const bountyId = bountyIssueObj[issue.number]
    const repoIdFromBounty = bountyId && bountyId.data.repoId
    if (bountyId && repoIdFromBounty === issue.repository.id) {
      const data = bountyIssueObj[issue.number].data
      const balance = BigNumber(bountyIssueObj[issue.number].data.balance)
        .div(BigNumber(10 ** tokenObj[data.token].decimals))
        .dp(3)
        .toString()

      return {
        ...issue,
        ...bountyIssueObj[issue.number].data,
        repoId: issue.repository.id,
        repo: issue.repository.name,
        symbol: tokenObj[data.token].symbol,
        expLevel: expLevels[data.exp].name,
        balance: balance,
        data,
      }
    }
    return {
      ...issue,
      repoId: issue.repository.id,
      repo: issue.repository.name,
    }
  }, [ tokens, bountyIssues, bountySettings ])

  return shapeIssue
}
