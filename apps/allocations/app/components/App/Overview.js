import React from 'react'

import { useAragonApi } from '../../api-react'
import { Button, Header, IconPlus } from '@aragon/ui'

import { AllocationsHistory, Budgets } from '.'
import { NewBudget } from '../Panel'
import { Empty } from '../Card'
import { usePanel } from '../../context/Panel'

const Overview = () => {
  const { api, appState } = useAragonApi()
  const { allocations = [], budgets = [], isSyncing = true } = appState
  const { setPanel } = usePanel()

  const saveBudget = ({ amount, name, token }) => {
    api
      .newAccount(
        name,             // _metadata
        token.address,    // _token
        true,             // hasBudget
        amount
      )
      .toPromise()
    setPanel(null)
  }

  const onNewBudget = () => {
    setPanel({
      content: NewBudget,
      data: { heading: 'New budget', saveBudget },
    })
  }

  if (budgets.length === 0) {
    return <Empty action={onNewBudget} isSyncing={isSyncing} />
  }

  return (
    <>
      <Header
        primary="Allocations"
        secondary={
          <Button
            mode="strong"
            icon={<IconPlus />}
            onClick={onNewBudget}
            label="New budget"
          />
        }
      />
      <Budgets />
      { !!allocations.length && <AllocationsHistory allocations={allocations} /> }
    </>
  )
}

export default Overview
