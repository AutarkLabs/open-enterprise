import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

import { AragonApp, AppBar, Button, SidePanel, IconAdd, observe } from '@aragon/ui'
import AppLayout from './components/AppLayout'
import Tools from './screens/Tools'
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
    accounts: []
  }

  handlePanelOpen = () => {
    this.setState({ panelActive: true })
  }

  handlePanelClose = () => {
    this.setState({ panelActive: false })
  }

  onCreateAccount = (account) => {
    const { title, limit } = account
    console.log(this.props.app.newPayout(account.title, account.limit.value, 0x0))
    console.log("something else")
    console.log(this.props.app)
    this.setState({})
  }

  render () {
    const barButton = (
      <DropDownButton>
        <Button Button mode="strong">
          New Account
        </Button>
        <DropDownContent>
          <DropDownItem onClick={this.handlePanelOpen}><CloseIcon />Informational Payput</DropDownItem>
          <DropDownItem><CloseIcon />One-time Payout</DropDownItem>
          <DropDownItem><CloseIcon />Monthly Payout</DropDownItem>
        </DropDownContent>
      </DropDownButton>
    )

    return (
      <AragonApp publicUrl="/aragon-ui/">
        <AppLayout>
          <AppLayout.Header>
            <AppBar
              title="Allocations"
              endContent={barButton}
            />
          </AppLayout.Header>
          <AppLayout.ScrollWrapper>
            <AppLayout.Content>
              <Tools
                onActivate={this.handlePanelOpen}
                button={barButton}
                accounts={this.state.accounts}
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
  background-color: #FFFFFF;
  border: 1px solid rgba(209,209,209,0.75);
  box-shadow: 0 4px 4px 0 rgba(0,0,0,0.03);
  border-radius: 3px;
  padding: .5rem 0;
  z-index: 1;
  margin-left: -8rem;
  white-space: nowrap;
`
const DropDownItem = styled.div`
  padding: .5rem 1rem;
  display: flex;
  &:hover {
    color: #00CBE6;
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
  color: #98A0A2;
  margin-right: .5rem;
`

export default observe(
  observable => observable.map(state => ({ ...state })),
  {}
)(App)