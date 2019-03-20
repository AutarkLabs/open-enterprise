import { AragonApp, observe, SidePanel, TabBar } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Overview, MyRewards } from '../Content'
import { Title } from '../Shared'
import { Empty } from '../Card'
import PanelManager, { PANELS } from '../Panel'
import NewRewardButton from './NewRewardButton'
import BigNumber from 'bignumber.js'

const ASSETS_URL = 'aragon-ui-assets/'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    rewards: PropTypes.arrayOf(PropTypes.object),
    balances: PropTypes.arrayOf(PropTypes.object),
  }

  onNewReward = reward => {
    console.log('Create New Reward from', reward)

    this.props.app.newReward(
      reward.rewardType ? false : true, //bool _isMerit,
      reward.referenceAsset, //address _referenceToken,
      reward.currency, //address _rewardToken,
      reward.amount, //uint _amount,
      reward.duration, //uint _duration,
      1, //uint _occurances,
      0 //uint _delay
    )
    this.closePanel()
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
    console.log('new reward props:', this.props)
    this.setState({
      panel: PANELS.NewReward,
      panelProps: {
        onNewReward: this.onNewReward,
        vaultBalance: '432.9 ETH',
        balances: this.props.balances,
      },
    })
  }

  reward = {
    creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
    isMerit: true,
    referenceToken: 'SDN',
    rewardToken: 0x0,
    amount: BigNumber(17e18),
    startDate: new Date('December 17, 2018'),
    endDate: new Date('January 17, 2019'),
    description: 'Q1 Reward for Space Decentral Contributors',
    delay: 0,
    index: 0
  }
  viewReward = (reward) => {
    this.setState({
      panel: PANELS.ViewReward,
      panelProps: {
        reward: reward,
      }
    })
  }
  render() {
    const { panel, panelProps } = this.state
    console.log('props: ', this.props)

    return (
      <StyledAragonApp>
        <Title text="Rewards" />
        <NewRewardButton onClick={this.newReward} />
        <TabBar
          items={this.state.tabs}
          selected={this.state.selected}
          onSelect={this.selectTab}
        />

        { this.state.selected === 1 ? (
          <MyRewards
            rewards={this.props.rewards === undefined ? [] : this.props.rewards}
            newReward={this.newReward}
          />
        ) : (
          <Overview
            rewards={this.props.rewards === undefined ? [] : this.props.rewards}
            newReward={this.newReward}
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
