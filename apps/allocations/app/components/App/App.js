import { Main, observe, SidePanel, Root, ToastHub } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Accounts, NewAccountButton, Payouts } from '.'
import { Title } from '../Shared'
import { NewAccount, NewAllocation } from '../Panel'
import { ETH_DECIMALS } from '../../utils/constants'
import { networkContextType } from '../../../../../shared/ui'
import { BigNumber } from 'bignumber.js'
import { allocationsMockData } from '../../utils/mockData'

const ASSETS_URL = 'aragon-ui-assets/'

const payouts = [{
  rewardToken: 0x0,
  amount: BigNumber(17e18),
  StartTime: new Date('2018-12-17'),
  recurring: false,
  period: 86400,
  description: 'Q1 Reward for Space Decentral Contributors',
  index: 0,
  distSet: true,
},
{
  rewardToken: 0x0,
  amount: BigNumber(17e18),
  StartTime: new Date('2018-12-17'),
  recurring: false,
  period: 86400,
  description: 'Q1 Reward for Space Decentral Contributors',
  index: 0,
  distSet: false,
},
]



const network = { type: 'rinkeby' }

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
    },
    // TODO: Don't use this in production
    ...allocationsMockData,
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
    this.props.app.newPayout(account.description)
    this.closePanel()
    console.info('App.js: Account Created:')
    console.table(account)
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
      allocation.token
    )
    console.info('App.js: Allocation submitted:')
    console.table(allocation)
    this.closePanel()
  }

  onExecutePayout = (accountId, payoutId) => {
    console.info('App.js: Executing Payout:')
    //console.info(id)
    //this.props.app.executePayout(id)
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

  newAllocation = (address, description, id) => {
    // The whole entries vs entities thing needs to be fixed; these are too close
    //const userEntity = {addr: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb', data: {entryAddress: '0x8401Eb5ff34cc943f096A32EF3d5113FEbE8D4Eb', name: 'Bob', entryType: 'user'}}
    const promptEntity = {
      addr: 0x0,
      data: { entryAddress: 0x0, name: 'Select an entry', entryType: 'prompt' },
    }
    const entriesList = [promptEntity].concat(this.props.entries)
    let entities = this.props.entries !== undefined ? entriesList : []
    this.setState({
      panel: {
        visible: true,
        content: NewAllocation,
        data: {
          address,
          id,
          heading: 'New Allocation',
          subHeading: description,
          onSubmitAllocation: this.submitAllocation,
          entities: entities,
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
    const PanelContent = panel.content
    return (
      // TODO: Profile App with React.StrictMode, perf and why-did-you-update, apply memoization
      <Root.Provider>
        <Main>
          <ToastHub>
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

            <Payouts
              payouts={
                this.props.payouts !== undefined ? this.props.payouts : []
              }
              newReward={this.createAccount}
              executePayout={this.onExecutePayout}
              network={network}
            />

            <SidePanel
              title={(panel.data && panel.data.heading) || ''}
              opened={panel.visible}
              onClose={this.closePanel}
            >
              {panel.content && <PanelContent {...panel.data} />}
            </SidePanel>
          </ToastHub>
        </Main>
      </Root.Provider>
    )
  }
}

//const StyledAragonApp = styled(Main).attrs({
//  publicUrl: ASSETS_URL,
//})`
//  display: flex;
//  height: 100vh;
//  flex-direction: column;
//  align-items: stretch;
//  justify-content: stretch;
//`

export default observe(
  observable => observable.map(state => ({ ...state })),
  {}
)(App)
