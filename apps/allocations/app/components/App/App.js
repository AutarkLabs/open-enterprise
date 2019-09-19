import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { useAragonApi } from '../../api-react'
import { Button, Header, IconPlus, Main, SidePanel } from '@aragon/ui'

import { IdentityProvider } from '../../../../../shared/identity'
import { Empty } from '../Card'
import { NewAllocation, NewBudget } from '../Panel'
import { Accounts, Payouts } from '.'

const ASSETS_URL = './aragon-ui'

const nameSorter = (a, b) => a.data.name.toUpperCase() > b.data.name.toUpperCase() ? 1 : -1

const App = () => {
  const [ panel, setPanel ] = useState(null)

  const { api, appState } = useAragonApi()
  const { accounts = [], balances = [], entries = [], payouts = [] } = appState

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
      balance,
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
      data: { heading: 'New budget', onCreateBudget, connectedAccount }
    })
  }


  const onNewAllocation = (address, description, id, balance) => {
    // The whole entries vs entities thing needs to be fixed; these are too close
    //const userEntity = {addr: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb', data: {entryAddress: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb', name: 'Bob', entryType: 'user'}}
    const promptEntity = {
      addr: 0x0,
      data: { entryAddress: 0x0, name: 'Select an entry', entryType: 'prompt' },
    }

    const entities = [promptEntity].concat(entries.sort(nameSorter))
    setPanel({
      content: NewAllocation,
      data: {
        heading: 'New Allocation',
        subHeading: description,
        address,
        balance,
        balances,
        entities,
        id,
        onSubmitAllocation,
      },
    })
  }

  const { connectedAccount } = useAragonApi()

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

  if (accounts.length === 0) {
    return <Wrap><Empty action={onNewBudget} /></Wrap>
  }

  return (
    // TODO: Profile App with React.StrictMode, perf and why-did-you-update, apply memoization
    <Wrap>
      <Header
        primary="Allocations"
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={onNewBudget} label="New budget" />
        }
      />
      <Accounts
        accounts={accounts}
        onNewAllocation={onNewAllocation}
      />
    </Wrap>
  )
}

// eslint-disable-next-line import/no-unused-modules
export default App
