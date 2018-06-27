import React from 'react'
import PropTypes from 'prop-types'

import { AragonApp, AppBar, Button, SidePanel } from '@aragon/ui'
import AppLayout from './components/AppLayout'
import Tools from './screens/Tools'
import { NewPayoutVotePanelContent } from './components/Panels'

const initialState = {
  template: null,
  templateData: {},
  stepIndex: 0,
  panelActive: false,
}

export default class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      ...initialState
    }
  }

  handlePanelOpen = () => {
    this.setState({ panelActive: true })
  }

  handlePanelClose = () => {
    this.setState({ panelActive: false })
  }

  render () {
    const barButton = (
      <Button mode="strong" onClick={this.handlePanelOpen}>
        New Payout
      </Button>
    )

    return (
      <AragonApp publicUrl="/aragon-ui/">
        <AppLayout>
          <AppLayout.Header>
            <AppBar
              title="Payout Engine"
              endContent={barButton}
            />
          </AppLayout.Header>
          <AppLayout.ScrollWrapper>
            <AppLayout.Content>
               <Tools onActivate={this.handlePanelOpen} />
            </AppLayout.Content>
          </AppLayout.ScrollWrapper>
        </AppLayout>
        <SidePanel
          opened={this.state.panelActive}
          onClose={this.handlePanelClose}
        >
          <NewPayoutVotePanelContent />
        </SidePanel>
      </AragonApp>
    )
  }
}
