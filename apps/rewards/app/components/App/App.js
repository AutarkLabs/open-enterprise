import { AppBar, AppView, Main, observe, TabBar, font } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { map } from 'rxjs/operators'
import throttle from 'lodash.throttle'
import { Overview, MyRewards } from '../Content'
import PanelManager, { PANELS } from '../Panel'
import {
  millisecondsToBlocks,
  MILLISECONDS_IN_A_MONTH,
  MILLISECONDS_IN_A_QUARTER,
  millisecondsToMonths,
  millisecondsToQuarters,
  WEEK
} from '../../../../../shared/ui/utils'
import BigNumber from 'bignumber.js'
import { networkContextType, AppTitle, AppTitleButton } from '../../../../../shared/ui'

const CONVERT_API_BASE = 'https://min-api.cryptocompare.com/data'
const CONVERT_THROTTLE_TIME = 5000

const convertApiUrl = symbols =>
  `${CONVERT_API_BASE}/price?fsym=USD&tsyms=${symbols.join(',')}`

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    rewards: PropTypes.arrayOf(PropTypes.object),
    balances: PropTypes.arrayOf(PropTypes.object),
  }

  constructor(props) {
    super(props)

    this.state = {
      selected: 0,
      tabs: [ 'Overview', 'My Rewards' ],
    }
    this.updateRewards()
  }

  static defaultProps = {
    network: {},
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

  shouldComponentUpdate(nextProps, nextState) {
    // do not re-render if the NewReward
    // panel is open
    if (this.state.panel && this.state.panel === nextState.panel) {
      return false
    }
    return true
  }

  componentDidUpdate(prevProps) {
    this.updateConvertedRates(this.props)
    if (prevProps.userAccount !== this.props.userAccount) {
      this.updateRewards()
    }
  }

  updateConvertedRates = throttle(async ({ balances = [] }) => {
    const verifiedSymbols = balances
      .filter(({ verified }) => verified)
      .map(({ symbol }) => symbol)

    if (!verifiedSymbols.length) {
      return
    }

    const res = await fetch(convertApiUrl(verifiedSymbols))
    const convertRates = await res.json()
    if (JSON.stringify(this.state.convertRates) !== JSON.stringify(convertRates)) {
      this.setState({ convertRates })
    }
  }, CONVERT_THROTTLE_TIME)

  updateRewards = async () => {
    this.props.app.cache('requestRefresh', {
      event: 'RefreshRewards',
      returnValues: {
        userAddress: this.props.userAccount
      },
    })
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
    this.updateRewards()
  }

  getRewards = (rewards) => {
    return rewards === undefined ? [] : rewards
  }

  newReward = () => {
    this.setState({
      panel: PANELS.NewReward,
      panelProps: {
        onNewReward: this.onNewReward,
        vaultBalance: '432.9 ETH',
        balances: this.props.balances,
        refTokens: this.props.refTokens,
        app: this.props.app,
        network: this.props.network,
      },
    })
  }

  onNewReward = async reward => {
    let currentBlock = await this.props.app.web3Eth('getBlockNumber').toPromise()
    let startBlock = currentBlock + millisecondsToBlocks(Date.now(), reward.dateStart)
    if (!reward.isMerit) {
      switch (reward.disbursementCycle) {
      case 'Quarterly':
        reward.occurances = millisecondsToQuarters(reward.dateStart, reward.dateEnd)
        reward.duration = millisecondsToBlocks(Date.now(), MILLISECONDS_IN_A_QUARTER + Date.now())
        break
      default: // Monthly
        reward.occurances = millisecondsToMonths(reward.dateStart, reward.dateEnd)
        reward.duration = millisecondsToBlocks(Date.now(), MILLISECONDS_IN_A_MONTH + Date.now())
      }
      switch(reward.disbursementDelay) {
      case '1 week':
        reward.delay = millisecondsToBlocks(Date.now(), Date.now() + WEEK)
        break
      case '2 weeks':
        reward.delay = millisecondsToBlocks(Date.now(), Date.now() + (2 * WEEK))
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
    console.log('submitting: ',reward)
    this.props.app.newReward(
      reward.description, //string _description
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
    this.props.app.claimReward(Number(reward.rewardId))
    this.closePanel()
  }

  myReward = reward => {
    this.setState({
      panel: PANELS.MyReward,
      panelProps: {
        onClaimReward: this.onClaimReward,
        onClosePanel: this.closePanel,
        reward,
        tokens: this.props.balances,
        viewReward: this.viewReward,
      },
    })
  }

  viewReward = reward => {
    this.setState({
      panel: PANELS.ViewReward,
      panelProps: {
        reward: reward,
        tokens: this.props.balances,
        onClosePanel: this.closePanel,
        network: { type: 'rinkeby' }
      }
    })
  }

  openDetailsView = reward => {
    this.viewReward(reward)
  }
  openDetailsMy = reward => {
    this.myReward(reward)
  }

  render() {
    const { panel, panelProps } = this.state
    const { network, displayMenuButton = false } = this.props

    return (
      <Main>
        <AppView
          appBar={
            <AppBar
              endContent={
                <AppTitleButton
                  caption="New Reward"
                  onClick={this.newReward}
                />
              }
              tabs={
                <TabBar
                  items={this.state.tabs}
                  selected={this.state.selected}
                  onSelect={this.selectTab}
                />
              }
            >
              <AppTitle title="Rewards" displayMenuButton={displayMenuButton} />
            </AppBar>
          }
        >
          { this.state.selected === 1 ? (
            <MyRewards
              rewards={this.props.rewards === undefined ? [] : this.props.rewards}
              newReward={this.newReward}
              openDetails={this.openDetailsMy}
              network={network}
              onClaimReward={this.onClaimReward}
              tokens={this.props.balances}
              convertRates={this.state.convertRates}
            />
          ) : (
            <Overview
              rewards={this.props.rewards === undefined ? [] : this.props.rewards}
              newReward={this.newReward}
              openDetails={this.openDetailsView}
              network={network}
              tokens={this.props.balances}
              convertRates={this.state.convertRates}
              claims={this.props.claims}
            />
          )}
        </AppView>

        <PanelManager
          onClose={this.closePanel}
          activePanel={panel}
          {...panelProps}
        />
      </Main>
    )
  }
}

export default observe(
  observable => observable.pipe(map(state => ({ ...state }))),
  {}
)(App)
