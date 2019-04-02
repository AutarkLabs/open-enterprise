import React from 'react'
import { hot } from 'react-hot-loader'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { map } from 'rxjs/operators'

import {
  AppBar,
  Button,
  Main,
  SidePanel,
  IconAdd,
  observe,
  theme,
  ToastHub,
} from '@aragon/ui'
import AppLayout from './components/AppLayout'
import Decisions from './Decisions'
import { hasLoadedVoteSettings } from './utils/vote-settings'
import { NewPayoutVotePanelContent } from './components/Panels'
import { networkContextType } from '../../../shared/ui'

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
    const barButton = (
      <DropDownButton>
        <Button Button mode="strong">
          Actions
        </Button>
        <DropDownContent>
          <DropDownItem>
            <CloseIcon />
            New Payout Engine
          </DropDownItem>
          <DropDownItem>
            <CloseIcon />
            New Issue Curation
          </DropDownItem>
          <DropDownItem>
            <CloseIcon />
            New Budget Engine
          </DropDownItem>
        </DropDownContent>
      </DropDownButton>
    )

    return (
      <StyledAragonApp publicUrl="aragon-ui-assets/">
        <ToastHub>
          <AppLayout>
            <AppLayout.Header>
              <AppBar
                title="Range Voting"
                // endContent={barButton}
              />
            </AppLayout.Header>
            <AppLayout.ScrollWrapper>
              <AppLayout.Content>
                <Decisions
                  onActivate={this.handlePanelOpen}
                  app={this.props.app}
                  votes={
                    this.props.votes !== undefined ? this.props.votes : []
                  }
                  entries={
                    this.props.entries !== undefined ? this.props.entries : []
                  }
                  voteTime={this.props.voteTime}
                  minParticipationPct={
                    this.props.minParticipationPct
                      ? this.props.minParticipationPct.toFixed(2)
                      : 'N/A'
                  }
                  tokenAddress={this.props.tokenAddress}
                  userAccount={this.props.userAccount}
                />
              </AppLayout.Content>
            </AppLayout.ScrollWrapper>
          </AppLayout>
          <SidePanel
            title={''}
            opened={this.state.panelActive}
            onClose={this.handlePanelClose}
          >
            <NewPayoutVotePanelContent />
          </SidePanel>
        </ToastHub>
      </StyledAragonApp>
    )
  }
}

const StyledAragonApp = styled(Main)`
  display: flex;
  height: 100vh;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
`

const DropDownContent = styled.div`
  display: none;
  position: absolute;
  background-color: ${theme.contentBackground};
  border: 1px solid · ${theme.contentBorder};
  box-shadow: 0 4px 4px 0 ${theme.shadow};
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
    color: ${theme.mainBgGradientStart};
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
  color: ${theme.textSecondary};
  margin-right: 0.5rem;
`

export default observe(
  observable => observable.pipe(map(state => ({ ...state }))),
  {}
)(hot(module)(App))
