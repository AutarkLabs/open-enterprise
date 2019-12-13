import React from 'react'

import { useAragonApi } from '../../api-react'
import { Button, Header, IconPlus } from '@aragon/ui'

import { AllocationsHistory, Budgets } from '.'
import { NewBudget } from '../Panel'
import { Empty } from '../Card'
import { usePanel } from '../../context/Panel'
import useSaveBudget from '../../hooks/useSaveBudget'

const Overview = () => {
  const { appState } = useAragonApi()
  const { allocations = [], budgets = [], isSyncing = true } = appState
  const { setPanel } = usePanel()
  const saveBudget = useSaveBudget()

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
