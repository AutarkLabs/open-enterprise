import React from 'react'
import { hot } from 'react-hot-loader'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { map } from 'rxjs/operators'

import { AppBar, AppView, Main, SidePanel, observe, font } from '@aragon/ui'
import Decisions from './Decisions'
import { hasLoadedVoteSettings } from './utils/vote-settings'
import { NewPayoutVotePanelContent } from './components/Panels'
import { networkContextType, AppTitle } from '../../../shared/ui'

const initialState = {
  template: null,
  templateData: {},
  stepIndex: 0,
  settingsLoaded: false,
  panelActive: false,
}

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }

  static defaultProps = {
    network: {},
  }

  static childContextTypes = {
    network: networkContextType,
  }

  constructor(props) {
    super(props)
    this.state = {
      ...initialState,
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

  componentWillReceiveProps(nextProps) {
    const { settingsLoaded } = this.state
    // Is this the first time we've loaded the settings?
    if (!settingsLoaded && hasLoadedVoteSettings(nextProps)) {
      this.setState({
        settingsLoaded: true,
      })
    }
  }

  handlePanelOpen = () => {
    this.setState({ panelActive: true })
  }

  handlePanelClose = () => {
    this.setState({ panelActive: false })
  }

  render() {
    const { displayMenuButton = false } = this.props

    return (
      <Main>
        <AppView
          appBar={
            <AppBar>
              <AppTitle
                title="Dot Voting"
                displayMenuButton={displayMenuButton}
                css="padding-left: 30px"
              />
            </AppBar>
          }
        >
          <Decisions
            onActivate={this.handlePanelOpen}
            app={this.props.app}
            votes={this.props.votes !== undefined ? this.props.votes : []}
            entries={this.props.entries !== undefined ? this.props.entries : []}
            voteTime={this.props.voteTime}
            minParticipationPct={
              this.props.minParticipationPct
                ? this.props.minParticipationPct / 10 ** 16
                : 'N/A'
            }
            tokenAddress={this.props.tokenAddress}
            userAccount={this.props.userAccount}
          />
        </AppView>

        <SidePanel
          title={''}
          opened={this.state.panelActive}
          onClose={this.handlePanelClose}
        >
          <NewPayoutVotePanelContent />
        </SidePanel>
      </Main>
    )
  }
}

export default observe(
  observable => observable.pipe(map(state => ({ ...state }))),
  {}
)(hot(module)(App))
