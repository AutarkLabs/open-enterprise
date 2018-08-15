import React from 'react'
import { hot } from 'react-hot-loader'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import {
  AragonApp,
  AppBar,
  Button,
  SidePanel,
  IconAdd,
  observe,
} from '@aragon/ui'
import AppLayout from './components/AppLayout'
import Allocations from './screens/Allocations'
import { NewAccountPanelContent } from './components/Panels'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }

  state = {
    template: null,
    templateData: {},
    stepIndex: 0,
    panelActive: false,
    accounts: [],
  }


  handlePanelOpen = () => {

    this.setState({ panelActive: true })
  }

  handlePanelClose = () => {
    this.setState({ panelActive: false })
  }

  onCreateAccount = account => {
    const { title, limit } = account
    console.log(this.props.app.newPayout(account.title, account.limit.value, 0x0))
    console.log(this.props.app.newPayout)
    console.log(this.props.app)

    this.setState({})
  }

  
  onSetDistribution = (options, addresses, payoutId, activeAllocationItem, activePayoutOption, amount) => {
    console.log("it's working!")
    console.log(options+addresses+payoutId+activeAllocationItem+activePayoutOption+amount)
    // need proper payoutId
    // add logic to define period
    //this.props.app.setDistribution(options, addresses, [], 0, activeAllocationItem === 0, activePayoutOption ===0, 0, 0)
    console.log("empty arrays1")
    console.log(this.props.app.setDistribution([], [], 0, true, true, 0, 0))
    console.log("empty arrays2")
    console.log(this.props.app.setDistribution(addresses, [], 0, activeAllocationItem === 0, activePayoutOption === 0, 86399 * 30, amount))

    console.log("end")
    this.setState({})
  }


  render() {
    const barButton = (
      <Button Button mode="strong" onClick={this.handlePanelOpen}>
        New Account
      </Button>
    )

    return (
      <AragonApp publicUrl="aragon-ui-assets/">
        <AppLayout>
          <AppLayout.Header>
            <AppBar title="Allocations" endContent={barButton} />
          </AppLayout.Header>
          <AppLayout.ScrollWrapper>
            <AppLayout.Content>
              <Allocations
                onSetDistribution = {this.onSetDistribution}
                onActivate={this.handlePanelOpen}
                onClose={this.handlePanelClose}
                button={barButton}
                accounts= {(this.props.accounts !== undefined) ? this.props.accounts : []}
              />
            </AppLayout.Content>
          </AppLayout.ScrollWrapper>
        </AppLayout>
        <SidePanel
          opened={this.state.panelActive}
          onClose={this.handlePanelClose}
        >
          <NewAccountPanelContent
            onCreateAccount={this.onCreateAccount}
            onClose={this.handlePanelClose}
          />
        </SidePanel>
      </AragonApp>
    )
  }
}

const DropDownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #ffffff;
  border: 1px solid rgba(209, 209, 209, 0.75);
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
  border-radius: 3px;
  padding: 0.5rem 0;
  z-index: 1;
  margin-left: -8rem;
  white-space: nowrap;
`
const DropDownItem = styled.div`
  padding: 0.5rem 1rem;
  display: flex;
  &:hover {
    color: #00cbe6;
    cursor: pointer;
  }
`

const DropDownButton = styled.div`
  position: relative;
  display: inline-block;
  &:hover ${DropDownContent} {
    display: block;
  }
`

const CloseIcon = styled(IconAdd)`
  color: #98a0a2;
  margin-right: 0.5rem;
`

export default observe(
  observable => observable.map(state => ({ ...state })),
  {}
)(App)