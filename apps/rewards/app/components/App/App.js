import { AragonApp, observe, SidePanel, TabBar, Button } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Overview, MyRewards } from '../Content'
import { Title } from '../Shared'
import { Empty } from '../Card'
import PanelManager, { PANELS } from '../Panel'
import NewRewardButton from './NewRewardButton'
//import BigNumber from 'bignumber.js'

const ASSETS_URL = 'aragon-ui-assets/'

const reward = {
  creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  isMerit: true,
  referenceToken: 'SDN',
  rewardToken: 0x0,
  // amount: BigNumber(17e18),
  amount: 10,
  startDate: new Date('2018-12-17'),
  endDate: new Date('2019-01-17'),
  description: 'Q1 Reward for Space Decentral Contributors',
  delay: 0,
  index: 0,
  claimed: true,
}

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    rewards: PropTypes.arrayOf(PropTypes.object),
  }

  state = {
    selected: 0,
    tabs: [ 'Overview', 'My Rewards' ],
  }

  closePanel = () => {
    this.setState({ panel: undefined, panelProps: undefined })
  }

  selectTab = idx => {
    this.setState({ selected: idx })
  }

  newReward = () => {
    this.setState({
      panel: PANELS.NewReward,
      panelProps: {
        onNewReward: this.onNewReward,
        vaultBalance: '432.9 ETH',
      },
    })
  }

  onNewReward = reward => {
    console.log('onNewReward', reward)
    this.closePanel()
  }

  onClaimReward = reward => {
    console.log('onClaimReward', reward)
    this.closePanel()
  }

  yourReward = () => {
    this.setState({
      panel: PANELS.YourReward,
      panelProps: {
        onClaimReward: this.onClaimReward,
        onClosePanel: this.closePanel,
        reward,
      },
    })
  }

  render() {
    const { panel, panelProps } = this.state

    return (
      <StyledAragonApp>
        <Title text="Rewards" />
        <Button mode="strong" onClick={this.yourReward}>test</Button>
        <NewRewardButton onClick={this.newReward} />
        <TabBar
          items={this.state.tabs}
          selected={this.state.selected}
          onSelect={this.selectTab}
        />

        { this.state.selected === 1 ? (
          <MyRewards
            rewards={this.props.rewards === undefined ? [] : this.props.rewards}
            onNewReward={this.onNewReward}
          />
        ) : (
          <Overview
            rewards={this.props.rewards === undefined ? [] : this.props.rewards}
            onNewReward={this.onNewReward}
          />
        )}

        <PanelManager
          onClose={this.closePanel}
          activePanel={panel}
          {...panelProps}
        />
      </StyledAragonApp>
    )
  }
}

const StyledAragonApp = styled(AragonApp).attrs({
  publicUrl: ASSETS_URL,
})`
  display: flex;
  height: 100vh;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
`

export default observe(
  observable => observable.map(state => ({ ...state })),
  {}
)(App)
