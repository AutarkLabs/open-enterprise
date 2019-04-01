import { AppBar, Main, observe, SidePanel, TabBar, Root, Viewport, font, breakpoint } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { map } from 'rxjs/operators'
import { Overview, MyRewards } from '../Content'
import { Title } from '../Shared'
import { Empty } from '../Card'
import PanelManager, { PANELS } from '../Panel'
import NewRewardButton from './NewRewardButton'
import { millisecondsToBlocks, MILLISECONDS_IN_A_MONTH, millisecondsToQuarters, WEEK } from '../../../../../shared/ui/utils'
import BigNumber from 'bignumber.js'
import { networkContextType, MenuButton } from '../../../../../shared/ui'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    rewards: PropTypes.arrayOf(PropTypes.object),
    balances: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    network: {},
  }

  state = {
    selected: 0,
    tabs: [ 'Overview', 'My Rewards' ],
  }

  static childContextTypes = {
    network: networkContextType,
  }

  getChildContext() {
    const { network } = this.props
    return {
      network: {
        type: network.type,
      },
    }
  }

  handleMenuPanelOpen = () => {
    window.parent.postMessage(
      { from: 'app', name: 'menuPanel', value: true }, '*'
    )
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
        onClosePanel: this.closePanel,
        network: { type: 'rinkeby' }
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

    // TODO: get tokens from vault
    const tokens = { 0x0: 'ETH' }

    return (
      <Root.Provider>
        <StyledAragonApp>
          <AppBar
            endContent={
              <NewRewardButton
                title="New Reward"
                onClick={this.newReward}
              />
            }
          >
            <AppBarTitle>
              <Viewport>
                {({ below }) =>
                  below('medium') && <MenuButton onClick={this.handleMenuPanelOpen} />
                }
              </Viewport>
              <AppBarLabel>Rewards</AppBarLabel>
            </AppBarTitle>
          </AppBar>

          <TabBar
            items={this.state.tabs}
            selected={this.state.selected}
            onSelect={this.selectTab}
          />
          { this.state.selected === 1 ? (
            <MyRewards
              rewards={this.props.rewards === undefined ? [] : this.props.rewards}
              newReward={this.newReward}
              openDetails={this.openDetailsMy}
              network={network}
              tokens={tokens}
            />
          ) : (
            <Overview
              rewards={this.props.rewards === undefined ? [] : this.props.rewards}
              newReward={this.newReward}
              openDetails={this.openDetailsView}
              network={network}
            />
          )}

          <PanelManager
            onClose={this.closePanel}
            activePanel={panel}
            {...panelProps}
          />
        </StyledAragonApp>
      </Root.Provider>
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
const AppBarTitle = styled.span`
  display: flex;
  align-items: center;
`

const AppBarLabel = styled.span`
  margin: 0 10px 0 8px;
  ${font({ size: 'xxlarge' })};

  ${breakpoint(
    'medium',
    `
      margin-left: 24px;
    `
  )};
`

export default observe(
  observable => observable.pipe(map(state => ({ ...state }))),
  {}
)(App)
