import React from 'react'
import { hot } from 'react-hot-loader'
import PropTypes from 'prop-types'

import { AragonApp, AppBar, Button, SidePanel, observe } from '@aragon/ui'
import { AppLayout, Accounts /*, NewAccount*/ } from '.'

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

const HeaderButton = ({ action }) => (
  <Button Button mode="strong" onClick={action}>
    New Account
  </Button>
)

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }

  state = {
    panelVisible: false,
    accounts: [],
    ...mockState,
  }

  openPanel = () => {
    this.setState({ panelVisible: true })
  }

  closePanel = () => {
    this.setState({ panelVisible: false })
  }

  addAccount = account => {
    this.setState(({ accounts }) => ({
      accounts: [...accounts, account],
    }))
    this.closePanel()
  }

  // TODO: Review previous code in this function
  setAllocation = () => {
    console.log('Allocation set.')
  }

  render() {
    return (
      // TODO: Profile App with strict mode, perf and why-did-you-update, apply memoization
      // <React.StrictMode>
      <AragonApp publicUrl="aragon-ui-assets/">
        <AppLayout>
          <AppLayout.Header>
            <AppBar
              title="Allocations"
              endContent={<HeaderButton action={this.openPanel} />}
            />
          </AppLayout.Header>
          <AppLayout.ScrollWrapper>
            <AppLayout.Content>
              <Accounts
                onSetDistribution={this.setAllocation}
                onActivate={this.openPanel}
                onClose={this.closePanel}
                button={<HeaderButton action={this.openPanel} />}
                accounts={
                  this.state.accounts !== undefined ? this.state.accounts : []
                }
              />
            </AppLayout.Content>
          </AppLayout.ScrollWrapper>
        </AppLayout>
        <SidePanel
          opened={this.state.panelVisible}
          onClose={this.closePanel}
          title="New Account"
        >
          <NewAccount
            addAccount={this.addAccount}
            onClose={this.handlePanelClose}
          />
        </SidePanel>
      </AragonApp>
      // {/* </React.StrictMode> */}
    )
  }
}

export default hot(module)(
  observe(observable => observable.map(state => ({ ...state })), {})(App)
)
