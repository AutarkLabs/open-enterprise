import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Motion, spring } from 'react-motion'
import { spring as springConf } from '@aragon/ui'
import { AragonApp, AppBar, Button, SidePanel, Text, observe } from '@aragon/ui'
import AppLayout from './components/AppLayout'
import EmptyState from './screens/EmptyState'
import Dashboard from './screens/Dashboard'
import Tools from './screens/Tools'
import Issues from './screens/Issues'
import Proposals from './screens/Proposals'
import { noop } from './utils/utils'
import { networkContextType } from './utils/provideNetwork'

import LoginButton from './components/LoginButton'

import RangeVoting from './range-voting/RangeVoting'

const SPRING_SHOW = {
  stiffness: 120,
  damping: 17,
  precision: 0.001,
}
const SPRING_HIDE = {
  stiffness: 70,
  damping: 15,
  precision: 0.001,
}
const SPRING_SCREEN = springConf('slow')

const initialState = {
  template: null,
  templateData: {},
  stepIndex: 0,
  direction: 1,
  activeTabId: 0
}

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
  }
  static defaultProps = {
    account: '',
    balance: null,
    network: {
      etherscanBaseUrl: 'https://rinkeby.etherscan.io',
      name: 'rinkeby',
    },
    visible: true,
    walletWeb3: null,
    web3: null,
    connected: false,
    contractCreationStatus: 'none',
    onComplete: noop,
    onCreateContract: noop,
    tabs: [ {id: 0, name: 'Dashboard', screen: Dashboard },
{id: 1, name: 'Issues', screen: Issues},
{id: 2, name: 'Proposals', screen: Proposals},
{id: 3, name: 'Tools', screen: Tools},
    ],
  }
  static childContextTypes = {
    network: networkContextType,
  }
  getChildContext() {
    return { network: this.props.network }
  }

  state = {
    ...initialState,
  }

  componentWillReceiveProps(nextProps) {
    const { props } = this
  }

  
  handleTabClick(id) {
    return event => {
      this.setState({
        activeTabId: id
      })
      console.log ('handleTabClick: ' + id)
    }
  }
  

  render () {
    const { tabs } = this.props
    const { activeTabId } = this.state
    const Screen = tabs[activeTabId].screen

    return (
      <AragonApp publicUrl="/aragon-ui/">
        <AppLayout>
          <AppLayout.Header>
            <AppBar
              title="Planning"
              endContent={
                <Button mode="strong" onClick={this.handleCreateProject}>
                  New Project
                </Button>
              }
            />
          </AppLayout.Header>
          <Tabs>{
            tabs.map (({id, name}) => (
              <Tab
                active={id === activeTabId}
                onClick={this.handleTabClick(id)}
                key={id}
              >{name}</Tab>
            ))}
          </Tabs>
          <AppLayout.ScrollWrapper>
            <AppLayout.Content>
               <Screen onActivate={this.handleCreateProject} />
            </AppLayout.Content>
          </AppLayout.ScrollWrapper>
        </AppLayout>
      </AragonApp>
    )
  }
}

const Tabs = styled.div`
  display: flex;
  height: 30px;
  background-color: #9EF;
  width: 100%;
  line-height: 30px;
`
const Tab = styled.div`
  font-size: '13px';
  margin-left: 20px;
  align-items: center;
  cursor: pointer;
  font-weight: ${({ active }) => (active ? '800' : '400')};
`

const Main = styled.div`
  position: fixed;
  z-index: 2;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  height: 100vh;
  background-image: linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.08) 0%,
      rgba(0, 0, 0, 0.08) 100%
    ),
    linear-gradient(-226deg, #00f1e1 0%, #00b4e4 100%);
`

const Window = styled.div`
  position: relative;
  width: 1080px;
  height: 660px;
  background: #fff;
  border-radius: 3px;
  box-shadow: 0 10px 28px 0 rgba(11, 103, 157, 0.7);
`

const Screen = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: ${({ active }) => (active ? 'auto' : 'none')};
`



export default App;
