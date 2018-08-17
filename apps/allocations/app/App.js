import React from 'react'
import { hot } from 'react-hot-loader'
import PropTypes from 'prop-types'
import { AragonApp, AppBar, Button, SidePanel, observe } from '@aragon/ui'

import AppLayout from './components/AppLayout'
import Tools from './components/Tools'
import NewAccountPanel from './components/NewAccountPanel'

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
    console.log(
      '[allocations/app.js]',
      this.props.app.newPayout(account.title, account.limit.value, 0x0)
    )
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
          <NewAccountPanel
            onCreateAccount={this.onCreateAccount}
            onClose={this.handlePanelClose}
          />
        </SidePanel>
      </AragonApp>
    )
  }
}

export default hot(module)(
  observe(observable => observable.map(state => ({ ...state })), {})(App)
)
