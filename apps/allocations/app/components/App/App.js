import { Main, AppBar, AppView, SidePanel } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { Accounts, Payouts } from '.'
import { NewAccount, NewAllocation } from '../Panel'
import { networkContextType, AppTitle, AppTitleButton } from '../../../../../shared/ui'
import { useAragonApi } from '@aragon/api-react'
import { IdentityProvider } from '../../../../../shared/identity'

class App extends React.PureComponent {
  static propTypes = {
    api: PropTypes.object,
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
    this.props.api.newAccount(account.description)
    this.closePanel()
    this.setState({})
  }

  submitAllocation = allocation => {
    const emptyIntArray = new Array(allocation.addresses.length).fill(0)
    this.props.api.setDistribution(
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
    this.props.api.runPayout(accountId, payoutId)
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

  handleResolveLocalIdentity = address => {
    return this.props.api.resolveAddressIdentity(address).toPromise()
  }

  handleShowLocalIdentityModal = address => {
    return this.props.api
      .requestAddressIdentityModification(address)
      .toPromise()
  }

  render() {
    const { panel } = this.state
    const { displayMenuButton = false } = this.props
    const PanelContent = panel.content

    return (
      // TODO: Profile App with React.StrictMode, perf and why-did-you-update, apply memoization
      <Main>
        <IdentityProvider
          onResolve={this.handleResolveLocalIdentity}
          onShowLocalIdentityModal={this.handleShowLocalIdentityModal}>
          <AppView
            appBar={
              <AppBar
                endContent={
                  <AppTitleButton
                    caption="New Account"
                    onClick={this.newAccount}
                  />
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
              accounts={
                this.props.accounts || []
              }
              onNewAccount={this.newAccount}
              onNewAllocation={this.newAllocation}
              app={this.props.api}
            />
            <Payouts
              payouts={
                this.props.payouts || []
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
        </IdentityProvider>
      </Main>
    )
  }
}

export default () => {
  const { api, appState, displayMenuButton } = useAragonApi()
  return <App api={api} {...appState} displayMenuButton={displayMenuButton} />
}
