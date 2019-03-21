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
import { networkContextType } from '../../../../../shared/ui'

const ASSETS_URL = 'aragon-ui-assets/'

const mockRewards = [{
  creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  isMerit: true,
  referenceToken: 'SDN',
  rewardToken: 0x0,
  amount: BigNumber(17e18),
  startDate: new Date('2018-12-17'),
  endDate: new Date('2019-01-17'),
  description: 'Q1 Reward for Space Decentral Contributors',
  delay: 0,
  index: 0,
  claimed: true,
},
{
  creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  isMerit: true,
  referenceToken: 'SDN',
  rewardToken: 0x0,
  amount: BigNumber(18e18),
  startDate: new Date('2018-12-10'),
  endDate: new Date('2019-01-19'),
  description: 'Q2 Reward for Space Decentral Contributors',
  delay: 0,
  index: 0,
  claimed: true,
},
{
  creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  isMerit: false,
  referenceToken: 'SDN',
  rewardToken: 0x0,
  amount: BigNumber(19e18),
  startDate: new Date('2018-12-19'),
  endDate: new Date('2019-01-20'),
  description: 'Q3 Reward for Space Decentral Contributors',
  delay: 0,
  index: 0,
  claimed: true,
}]

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    rewards: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    network: {},
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

  myReward = reward => {
    this.setState({
      panel: PANELS.MyReward,
      panelProps: {
        onClaimReward: this.onClaimReward,
        onClosePanel: this.closePanel,
        vaultBalance: '432.9 ETH',
        reward,
      },
    })
  }

  viewReward = reward => {
    this.setState({
      panel: PANELS.ViewReward,
      panelProps: {
        reward: reward,
        network: { type: 'rinkeby'}
      }
    })
  }
  
  openDetailsView = reward => {
    console.log('App open details', reward)
    this.viewReward(reward)
  }
  openDetailsMy = reward => {
    console.log('App open details (my)', reward)
    this.myReward(reward)
  }

  render() {
    const { panel, panelProps } = this.state
    const { network } = this.props

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
            rewards={this.props.rewards === undefined ? mockRewards : this.props.rewards}
            onNewReward={this.onNewReward}
            openDetails={this.openDetailsMy}
            network={network}
          />
        ) : (
          <Overview
            rewards={this.props.rewards === undefined ? mockRewards : this.props.rewards}
            newReward={this.newReward}
            openDetails={this.openDetailsView}
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
