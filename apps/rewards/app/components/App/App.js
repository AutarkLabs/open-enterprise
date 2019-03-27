import { AragonApp, observe, SidePanel, TabBar } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Overview, MyRewards } from '../Content'
import { Title } from '../Shared'
import { Empty } from '../Card'
import PanelManager, { PANELS } from '../Panel'
import NewRewardButton from './NewRewardButton'
import { millisecondsToBlocks, MILLISECONDS_IN_A_MONTH, millisecondsToQuarters, WEEK } from '../../../../../shared/ui/utils'
import BigNumber from 'bignumber.js'

const ASSETS_URL = 'aragon-ui-assets/'

const reward = {
  creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  isMerit: true,
  referenceToken: 'SDN',
  rewardToken: 0x0,
  amount: BigNumber(17e18),
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
    balances: PropTypes.arrayOf(PropTypes.object),
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
        balances: this.props.balances,
      },
    })
  }

  onNewReward = async reward => {
    let currentBlock = await this.props.app.web3Eth('getBlockNumber').first().toPromise()
    let startBlock = currentBlock + millisecondsToBlocks(Date.now(), reward.dateStart)
    console.log(startBlock)
    if (!reward.isMerit) {
      switch (reward.disbursementCycle) {
      case 'Quarterly':
        reward.occurances = millisecondsToQuarters(reward.dateStart, reward.dateEnd)
        reward.duration = millisecondsToBlocks(Date.now(), 3 * MILLISECONDS_IN_A_MONTH + Date.now())
        break
      default: // Monthly
        reward.occurances = 12
        reward.duration = millisecondsToBlocks(Date.now(), MILLISECONDS_IN_A_MONTH + Date.now())
      }
      switch(reward.disbursementDelay) {
      case '1 week':
        reward.delay = millisecondsToBlocks(Date.now(), Date.now + WEEK)
        break
      case '2 weeks':
        reward.delay = millisecondsToBlocks(Date.now(), Date.now + (2 * WEEK))
        break
      default:
        reward.delay = 0
        break
      }
    }
    else {
      reward.occurances = 1
      reward.delay = 0
      reward.duration = millisecondsToBlocks(reward.dateStart, reward.dateEnd)
    }

    console.log(
      'isMerit ',reward.isMerit,
      '\nreferenceAsset ', reward.referenceAsset,
      '\ncurrency', reward.currency,
      '\namount', reward.amount,
      '\nstartBlock', startBlock,
      '\nduration', reward.duration,
      '\noccurances', reward.occurances,
      '\ndelay', reward.delay
    )



    this.props.app.newReward(
      reward.isMerit, //bool _isMerit,
      reward.referenceAsset, //address _referenceToken,
      reward.currency, //address _rewardToken,
      reward.amount, //uint _amount,
      startBlock, // uint _startBlock
      reward.duration, //uint _duration, (number of blocks until reward will be available)
      reward.occurances, //uint _occurances,
      reward.delay //uint _delay
    )
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
