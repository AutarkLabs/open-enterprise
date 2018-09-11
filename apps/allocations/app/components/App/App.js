import { AragonApp, observe, SidePanel } from '@aragon/ui'
import { hot } from 'react-hot-loader'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Accounts, NewAccountButton, Title } from '.'
import { NewAccount, NewAllocation } from '../Panel'

import { allocationsMockData } from '../../utils/mockData'

const ASSETS_URL = 'aragon-ui-assets/'

class AllocationsApp extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    accounts: PropTypes.arrayOf(PropTypes.object),
  }

  state = {
    accounts: [],
    panel: {
      visible: false,
    },
    // TODO: Don't use this in production
    // ...allocationsMockData,
  }

  createAccount = ({ limit, ...account }) => {
    account.balance = 0
    account.limit = parseInt(limit)
    this.setState(({ accounts }) => ({
      accounts: [...accounts, account],
    }))
    this.closePanel()
    console.info('App.js: Account Created:')
    console.table(account)
  }

  submitAllocation = allocation => {
    // TODO: Implement
    console.info('App.js: Allocation submitted:')
    console.table(allocation)
  }

  manageParameters = address => {
    // TODO: Implement
    console.info(
      `'App.js: Manage Parameters clicked from account with address: ${address}`
    )
  }

  newAccount = () => {
    this.setState({
      panel: {
        visible: true,
        content: NewAccount,
        data: { heading: 'New Account', onCreateAccount: this.createAccount },
      },
    })
  }

  newAllocation = (address, description) => {
    this.setState({
      panel: {
        visible: true,
        content: NewAllocation,
        data: {
          address,
          heading: 'New Allocation',
          subHeading: description,
          onSubmitAllocation: this.submitAllocation,
        },
      },
    })
  }

  closePanel = () => {
    this.setState({ panel: { visible: false } })
  }

  render() {
    const { accounts, panel } = this.state
    const PanelContent = panel.content
    return (
      // TODO: Profile App with React.StrictMode, perf and why-did-you-update, apply memoization
      <StyledAragonApp>
        <Title text="Allocations" />
        <NewAccountButton onClick={this.newAccount} />
        <Accounts
          accounts={accounts}
          onNewAccount={this.newAccount}
          onNewAllocation={this.newAllocation}
          onManageParameters={this.manageParameters}
        />
        <SidePanel
          title={(panel.data && panel.data.heading) || ''}
          opened={panel.visible}
          onClose={this.closePanel}
        >
          {panel.content && <PanelContent {...panel.data} />}
        </SidePanel>
      </StyledAragonApp>
    )
  }
}

const StyledAragonApp = styled(AragonApp).attrs({
  publicUrl: ASSETS_URL,
})`
  display: flex;
  height: 100vh;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
`

export default hot(module)(
  observe(observable => observable.map(state => ({ ...state })), {})(
    AllocationsApp
  )
)
