import { AragonApp, observe, SidePanel } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Accounts, NewAccountButton } from '.'
import { Title } from '../Shared'
import { NewAccount, NewAllocation } from '../Panel'

// import { allocationsMockData } from '../../utils/mockData'

const ASSETS_URL = 'aragon-ui-assets/'

class App extends React.Component {
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
    account.limit = parseInt(limit)*10e17
    this.props.app.newPayout(account.description, account.limit, 0x0)
    this.closePanel()
    console.info('App.js: Account Created:')
    console.table(account)
    this.setState({})    
  }

  submitAllocation = allocation => {
    this.props.app.setDistribution(
      allocation.addresses,
      [],
      allocation.payoutId,
      allocation.informational,
      allocation.recurring,
      allocation.period,
      allocation.balance
    )
    console.info('App.js: Allocation submitted:')
    console.table(allocation)
    this.closePanel()   
  }

  onExecutePayout = id => {
    console.info('App.js: Executing Payout:')
    console.info(id)
    this.props.app.executePayout(id)
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

  newAllocation = (address, description, id, limit) => {
    // The whole entries vs entities thing needs to be fixed; these are too close
    let entities = this.props.entries !== undefined ? this.props.entries : []
    this.setState({
      panel: {
        visible: true,
        content: NewAllocation,
        data: {
          address,
          id,
          limit,
          heading: 'New Allocation',
          subHeading: description,
          onSubmitAllocation: this.submitAllocation,
          entities: entities
        },
      },
    })
  }

  closePanel = () => {       
    this.setState({ panel: { visible: false } })
  }

  render() {
    const { panel } = this.state
    const PanelContent = panel.content
    return (
      // TODO: Profile App with React.StrictMode, perf and why-did-you-update, apply memoization
      <StyledAragonApp>
        <Title text="Allocations" />
        <NewAccountButton onClick={this.newAccount} />
        <Accounts
          accounts={
            this.props.accounts !== undefined ? this.props.accounts : []
          }
          onNewAccount={this.newAccount}
          onNewAllocation={this.newAllocation}
          onManageParameters={this.manageParameters}
          onExecutePayout={this.onExecutePayout}
          app={this.props.app}
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

export default observe(
  observable => observable.map(state => ({ ...state })),
  {}
)(App)
