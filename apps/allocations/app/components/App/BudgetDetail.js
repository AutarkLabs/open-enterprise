import React from 'react'
import { useAragonApi, usePath } from '../../api-react'

const ID_REGEX = new RegExp('^/budgets/(?<id>[0-9]+)')

export default function BudgetDetail() {
  const { appState } = useAragonApi()
  const [ path, requestPath ] = usePath()

  const matchData = path.match(ID_REGEX)
  if (!matchData) requestPath('/')

  const { id } = matchData.groups

  const budget = appState.budgets.find(b => b.id === id)
  if (!budget) requestPath('/')

  return <pre>{JSON.stringify(budget)}</pre>
}
