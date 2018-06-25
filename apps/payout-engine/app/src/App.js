import React from 'react'
import PropTypes from 'prop-types'

import { AragonApp, AppBar, Button } from '@aragon/ui'
import AppLayout from './components/AppLayout'
import Tools from './screens/Tools'
import RangeVoting from './range-voting/RangeVoting'

const initialState = {
  template: null,
  templateData: {},
  stepIndex: 0,
  rangeWizardActive: false,
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

  handleRangeWizardOpen = () => {
    this.setState({ rangeWizardActive: true })
  }

  handleRangeWizardClose = () => {
    this.setState({ rangeWizardActive: false })
  }

  render () {
    const barButton = (
      <Button mode="strong" onClick={this.handleRangeWizardOpen}>
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
               <Tools onActivate={this.handleRangeWizardOpen} />
            </AppLayout.Content>
          </AppLayout.ScrollWrapper>
        </AppLayout>

      {this.state.rangeWizardActive && (
        <RangeVoting
          visible={true}
          app={this.props.app}
          handleClose={this.handleRangeWizardClose}
        />
      )}
      </AragonApp>
    )
  }
}
