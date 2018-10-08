import React from 'react'
import { hot } from 'react-hot-loader'
import { AragonApp, AppBar } from '@aragon/ui'

import AppLayout from './AppLayout'
import AddressBook from './AddressBook'

class App extends React.Component {
  static defaultProps = {
    network: {
      etherscanBaseUrl: 'https://rinkeby.etherscan.io',
      name: 'rinkeby',
    },
  }

  render() {
    return (
      <AragonApp publicUrl="aragon-ui-assets/">
        <AppLayout>
          <AppLayout.Header>
            <AppBar title="AddressBook" />
          </AppLayout.Header>
          <AppLayout.ScrollWrapper>
            <AppLayout.Content>
              <AddressBook />
            </AppLayout.Content>
          </AppLayout.ScrollWrapper>
        </AppLayout>
      </AragonApp>
    )
  }
}

export default hot(module)(App)
