import React from 'react'
import { hot } from 'react-hot-loader'
import PropTypes from 'prop-types'

import { AragonApp, AppBar, Button, SidePanel, observe } from '@aragon/ui'
import { AppLayout, Accounts, NewAccount } from '.'

const mockState = {
  accounts: [
    {
      address: '0x45f393112AdeDFA9604434bAbFfF679be28c5567',
      balance: 10,
      description: 'Monthly Reward DAO',
      limit: '5',
      token: 'ETH',
    },
    {
      address: '0x56f393112AdeDFA9604434bAbFfF679be28c41ef',
      balance: 8,
      description: 'Q4 2018 Specials Projects',
      limit: '8',
      token: 'ETH',
    },
  ],
}

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }

  state = {
    panelActive: false,
    accounts: [],
    ...mockState,
  }

  handlePanelOpen = () => {
    this.setState({ panelActive: true })
  }

  handlePanelClose = () => {
    this.setState({ panelActive: false })
  }

  onCreateAccount = account => {
    this.setState(({ accounts }) => ({
      accounts: [...accounts, account],
    }))
    this.handlePanelClose()
  }

  onSetDistribution = () =>
  // options,
  // addresses,
  // payoutId,
  // activeAllocationItem,
  // activePayoutOption,
  // amount
  {
    // TODO: need proper payoutId
    // add logic to define period
    //this.props.app.setDistribution(options, addresses, [], 0, activeAllocationItem === 0, activePayoutOption ===0, 0, 0)
    // console.error('empty arrays1')
    // console.error(this.props.app.setDistribution([], [], 0, true, true, 0, 0))
    // console.error('empty arrays2')
    // console.error(
    //   this.props.app.setDistribution(
    //     addresses,
    //     [],
    //     0,
    //     activeAllocationItem === 0,
    //     activePayoutOption === 0,
    //     86399 * 30,
    //     amount
    //   )
    // )

    console.info('[Allocations > script] onSetDistribution end')
  }

  render() {
    const barButton = (
      <Button Button mode="strong" onClick={this.handlePanelOpen}>
        New Account
      </Button>
    )

    return (
      <React.StrictMode>
        <AragonApp publicUrl="aragon-ui-assets/">
          <AppLayout>
            <AppLayout.Header>
              <AppBar title="Allocations" endContent={barButton} />
            </AppLayout.Header>
            <AppLayout.ScrollWrapper>
              <AppLayout.Content>
                <Accounts
                  onSetDistribution={this.onSetDistribution}
                  onActivate={this.handlePanelOpen}
                  onClose={this.handlePanelClose}
                  button={barButton}
                  accounts={
                    this.state.accounts !== undefined ? this.state.accounts : []
                  }
                />
              </AppLayout.Content>
            </AppLayout.ScrollWrapper>
          </AppLayout>
          <SidePanel
            opened={this.state.panelActive}
            onClose={this.handlePanelClose}
            title="New Account"
          >
            <NewAccount
              onCreateAccount={this.onCreateAccount}
              onClose={this.handlePanelClose}
            />
          </SidePanel>
        </AragonApp>
      </React.StrictMode>
    )
  }
}

export default hot(module)(
  observe(observable => observable.map(state => ({ ...state })), {})(App)
)
