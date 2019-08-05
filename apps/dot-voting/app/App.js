import React from 'react'
import PropTypes from 'prop-types'
import { AppBar, AppView, Main, SidePanel } from '@aragon/ui'
import Decisions from './Decisions'
import { hasLoadedVoteSettings } from './utils/vote-settings'
import { NewPayoutVotePanelContent } from './components/Panels'
import { AppTitle, networkContextType } from '../../../shared/ui'
import { useAragonApi } from '@aragon/api-react'
import { IdentityProvider } from '../../../shared/identity'

const initialState = {
  template: null,
  templateData: {},
  stepIndex: 0,
  settingsLoaded: false,
  panelActive: false,
}

class App extends React.Component {
  static propTypes = {
    api: PropTypes.object,
    displayMenuButton: PropTypes.bool.isRequired,
    votes: PropTypes.arrayOf(PropTypes.object).isRequired,
    entries: PropTypes.arrayOf(PropTypes.object).isRequired,
    connectedAccount: PropTypes.string.isRequired,
    network: PropTypes.object,
    tokenAddress: PropTypes.string.isRequired,
    minParticipationPct: PropTypes.number.isRequired,
    pctBase: PropTypes.number.isRequired,
    voteTime: PropTypes.number.isRequired,
  }

  static defaultProps = {
    network: {},
    votes: [],
    entries: [],
    tokenAddress: '',
    voteTime: 0,
    minParticipationPct: 0,
    pctBase: 0,
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

  handleResolveLocalIdentity = address => {
    return this.props.api.resolveAddressIdentity(address).toPromise()
  }

  handleShowLocalIdentityModal = address => {
    return this.props.api
      .requestAddressIdentityModification(address)
      .toPromise()
  }
  render() {
    const { displayMenuButton = false } = this.props
    return (
      <Main>
        <IdentityProvider
          onResolve={this.handleResolveLocalIdentity}
          onShowLocalIdentityModal={this.handleShowLocalIdentityModal}>
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
              app={this.props.api}
              votes={this.props.votes !== undefined ? this.props.votes : []}
              entries={this.props.entries !== undefined ? this.props.entries : []}
              voteTime={this.props.voteTime}
              minParticipationPct={this.props.minParticipationPct / 10 ** 16}
              pctBase={this.props.pctBase / 10 ** 16}
              tokenAddress={this.props.tokenAddress}
              userAccount={this.props.connectedAccount}
            />
          </AppView>

          <SidePanel
            title={''}
            opened={this.state.panelActive}
            onClose={this.handlePanelClose}
          >
            <NewPayoutVotePanelContent />
          </SidePanel>
        </IdentityProvider>
      </Main>
    )
  }
}

// eslint-disable-next-line react/display-name
export default () => {
  const { api, appState, connectedAccount, displayMenuButton } = useAragonApi()
  return <App api={api} {...appState} connectedAccount={connectedAccount} displayMenuButton={displayMenuButton} />
}
