import React from 'react'
import { Redirect, useParams } from 'react-router'
import { useAragonApi } from '../../api-react'

export default function BudgetDetail() {
  const { appState } = useAragonApi()
  const { id } = useParams()
  const budget = appState.budgets.find(b => b.id === id)

  if (!budget) {
    return <Redirect to="/" />
  }

  return JSON.stringify(budget)
}
