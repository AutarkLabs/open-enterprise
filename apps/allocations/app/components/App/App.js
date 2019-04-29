import { Main, observe, AppBar, AppView, SidePanel } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { map } from 'rxjs/operators'
import { Accounts, Payouts } from '.'
import { NewAccount, NewAllocation } from '../Panel'
import { networkContextType, AppTitle, AppTitleButton } from '../../../../../shared/ui'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    accounts: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    network: {},
  }

  static childContextTypes = {
    network: networkContextType,
  }

  state = {
    accounts: [],
    panel: {
      visible: false,
    }
  }

  getChildContext() {
    const { network } = this.props
    return {
      network: {
        type: network.type,
      },
    }
  }

  createAccount = (account) => {
    account.balance = 0
    this.props.app.newAccount(account.description)
    this.closePanel()
    this.setState({})
  }

  submitAllocation = allocation => {
    const emptyIntArray = new Array(allocation.addresses.length).fill(0)
    this.props.app.setDistribution(
      allocation.addresses,
      emptyIntArray, //[]
      emptyIntArray, //[]
      '',
      allocation.description,
      emptyIntArray, // Issue with bytes32 handling
      emptyIntArray, // Issue with bytes32 handling
      allocation.payoutId,
      allocation.recurring,
      allocation.period,
      allocation.balance,
      allocation.tokenAddress
    )
    this.closePanel()
  }

  onExecutePayout = (accountId, payoutId) => {
    this.props.app.runPayout(accountId, payoutId)
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

  entitiesSort = (a,b) => a.data.name.toUpperCase() > b.data.name.toUpperCase() ? 1 : -1

  newAllocation = (address, description, id, balance) => {
    // The whole entries vs entities thing needs to be fixed; these are too close
    //const userEntity = {addr: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb', data: {entryAddress: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb', name: 'Bob', entryType: 'user'}}
    const promptEntity = {
      addr: 0x0,
      data: { entryAddress: 0x0, name: 'Select an entry', entryType: 'prompt' },
    }
    let entities = this.props.entries !== undefined ? this.props.entries.sort(this.entitiesSort) : []
    const entriesList = [promptEntity].concat(entities)
    this.setState({
      panel: {
        visible: true,
        content: NewAllocation,
        data: {
          address,
          id,
          balance,
          heading: 'New Allocation',
          subHeading: description,
          onSubmitAllocation: this.submitAllocation,
          entities: entriesList,
          balances: this.props.balances ? this.props.balances : []
        },
      },
    })
  }

  closePanel = () => {
    this.setState({ panel: { visible: false } })
  }

  render() {
    const { panel } = this.state
    const { displayMenuButton = false } = this.props
    const PanelContent = panel.content
    return (
      // TODO: Profile App with React.StrictMode, perf and why-did-you-update, apply memoization
      <Main>
        <AppView
          padding={0}
          appBar={
            <AppBar
              endContent={
                <AppTitleButton
                  caption="New Account"
                  onClick={this.newAccount}
                />
              }
            >
              <AppTitle title="Allocations" displayMenuButton={displayMenuButton} />
            </AppBar>
          }
        >
          <Accounts
            accounts={
              this.props.accounts !== undefined ? this.props.accounts : []
            }
            onNewAccount={this.newAccount}
            onNewAllocation={this.newAllocation}
            app={this.props.app}
          />
          <Payouts
            payouts={
              this.props.payouts !== undefined ? this.props.payouts : []
            }
            executePayout={this.onExecutePayout}
            network={this.props.network}
            tokens={this.props.balances}
          />
        </AppView>

        <SidePanel
          title={(panel.data && panel.data.heading) || ''}
          opened={panel.visible}
          onClose={this.closePanel}
        >
          {panel.content && <PanelContent {...panel.data} />}
        </SidePanel>
      </Main>
    )
  }
}

export default observe(
  observable => observable.pipe(map(state => ({ ...state }))),
  {}
)(App)
