import React from 'react'
import { hot } from 'react-hot-loader'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { AragonApp, AppBar, Button, SidePanel, IconAdd } from '@aragon/ui'

import AppLayout from './components/AppLayout'
import Decisions from './components/Decisions'
import { NewPayoutVotePanelContent } from './components/Panels'

const initialState = {
  template: null,
  templateData: {},
  stepIndex: 0,
  panelActive: false,
}

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      ...initialState,
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
      <AragonApp publicUrl="aragon-ui-assets/">
        <AppLayout>
          <AppLayout.Header>
            <AppBar
              title="Range Voting"
              // endContent={barButton}
            />
          </AppLayout.Header>
          <AppLayout.ScrollWrapper>
            <AppLayout.Content>
              <Decisions onActivate={this.handlePanelOpen} />
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
