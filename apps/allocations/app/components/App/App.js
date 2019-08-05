import React, { useState } from 'react'

import { useAragonApi } from '@aragon/api-react'
import { AppBar, AppView, Main, SidePanel, Button } from '@aragon/ui'

import { AppTitle } from '../../../../../shared/ui'
import { IdentityProvider } from '../../../../../shared/identity'
import { NewAccount, NewAllocation } from '../Panel'
import { Accounts, Payouts } from '.'

const ASSETS_URL = './aragon-ui'

const nameSorter = (a, b) => a.data.name.toUpperCase() > b.data.name.toUpperCase() ? 1 : -1

const App = () => {
  const [ panel, setPanel ] = useState(null)
  const { api, appState, displayMenuButton = false } = useAragonApi()
  const { accounts = [], balances = [], entries = [], payouts = [] } = appState

  const onCreateAccount = ({ description }) => {
    api.newAccount(description)
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
    )
    closePanel()
  }

  const onExecutePayout = (accountId, payoutId) => {
    api.runPayout(accountId, payoutId)
  }

  const onNewAccount = () => {
    setPanel({
      content: NewAccount,
      data: { heading: 'New Account', onCreateAccount }
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

  const closePanel = () => {
    setPanel(null)
  }

  const handleResolveLocalIdentity = address => api.resolveAddressIdentity(address).toPromise()

  const handleShowLocalIdentityModal = address => api
    .requestAddressIdentityModification(address)
    .toPromise()

  const PanelContent = panel ? panel.content : null

  return (
    // TODO: Profile App with React.StrictMode, perf and why-did-you-update, apply memoization
    <Main assetsUrl={ASSETS_URL}>
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}>
        <AppView
          appBar={
            <AppBar
              endContent={
                <Button mode="strong" onClick={onNewAccount}>New Account</Button>
              }
            >
              <AppTitle
                title="Allocations"
                displayMenuButton={displayMenuButton}
                css="padding-left: 30px"
              />
            </AppBar>
          }
        >
          <Accounts
            accounts={accounts}
            onNewAccount={onNewAccount}
            onNewAllocation={onNewAllocation}
          />
          <Payouts
            payouts={payouts}
            executePayout={onExecutePayout}
            tokens={balances}
          />
        </AppView>

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
}

// eslint-disable-next-line import/no-unused-modules
export default App
