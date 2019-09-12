import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { useAragonApi } from '../../api-react'
import { Button, Header, IconPlus, Main, SidePanel } from '@aragon/ui'

import { IdentityProvider } from '../../../../../shared/identity'
import { Empty } from '../Card'
import { NewAllocation, NewBudget } from '../Panel'
import { Budgets, Payouts } from '.'

const ASSETS_URL = './aragon-ui'

const nameSorter = (a, b) => a.data.name.toUpperCase() > b.data.name.toUpperCase() ? 1 : -1

const App = () => {
  const [ panel, setPanel ] = useState(null)
  const { api, appState } = useAragonApi()
  const {
    // backend stub, remove
    budgets = [{
      budgetId: '0',
      data: {
        name: 'Marketing',
        amount: String(80000.123856789012345678e18),
        currency: 'ETH',
        allocated: String(23000e18),
      }
    }],
    balances = [],
    entries = [],
    payouts = []
  } = appState

  const onCreateBudget = ({ description }) => {
    api.newAccount(description).toPromise()
    closePanel()
  }

  const onSubmitAllocation = ({ addresses, description, payoutId, recurring, period, balance, tokenAddress }) => {
    const emptyIntArray = new Array(addresses.length).fill(0)
    api.setDistribution(
      addresses,
      emptyIntArray, //[]
      emptyIntArray, //[]
      '',
      description,
      emptyIntArray, // Issue with bytes32 handling
      emptyIntArray, // Issue with bytes32 handling
      payoutId,
      recurring,
      period,
      String(balance),
      tokenAddress
    ).toPromise()
    closePanel()
  }

  const onExecutePayout = (accountId, payoutId) => {
    api.runPayout(accountId, payoutId).toPromise()
  }

  const onNewBudget = () => {
    setPanel({
      content: NewBudget,
      data: { heading: 'New budget', onCreateBudget }
    })
  }


  const onNewAllocation = (address, description, id, balance) => {
    setPanel({
      content: NewAllocation,
      data: {
        heading: 'New Allocation',
        subHeading: description,
        address,
        balance,
        balances,
        id,
        onSubmitAllocation,
      },
    })
  }

  const closePanel = () => {
    setPanel(null)
  }

  const handleResolveLocalIdentity = address => api.resolveAddressIdentity(address).toPromise()

  const handleShowLocalIdentityModal = address => api
    .requestAddressIdentityModification(address)
    .toPromise()

  const PanelContent = panel ? panel.content : null

  const Wrap = ({ children }) => (
    <Main assetsUrl={ASSETS_URL}>
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}>
        { children }
        <Payouts
          payouts={payouts}
          executePayout={onExecutePayout}
          tokens={balances}
        />

        <SidePanel
          title={(panel && panel.data.heading) || ''}
          opened={panel !== null}
          onClose={closePanel}
        >
          {panel && <PanelContent {...panel.data} />}
        </SidePanel>
      </IdentityProvider>
    </Main>
  )

  Wrap.propTypes = {
    children: PropTypes.node.isRequired,
  }

  if (budgets.length === 0) {
    return <Wrap><Empty action={onNewBudget} /></Wrap>
  }

  return (
    <Wrap>
      <Header
        primary="Allocations"
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={onNewBudget} label="New budget" />
        }
      />
      <Budgets
        budgets={budgets}
        onNewAllocation={onNewAllocation}
      />
    </Wrap>
  )
}

export default App
