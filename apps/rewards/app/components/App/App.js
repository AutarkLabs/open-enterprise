import { Button, Header, IconPlus, Main, Tabs } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import throttle from 'lodash.throttle'
import { MyRewards, Overview } from '../Content'
import PanelManager, { PANELS } from '../Panel'
import styled from 'styled-components'
import { Empty } from '../Card'
import {
  MILLISECONDS_IN_A_DAY,
  MILLISECONDS_IN_A_WEEK,
  MILLISECONDS_IN_A_MONTH,
  MILLISECONDS_IN_A_YEAR,
  millisecondsToBlocks,
  millisecondsToDays,
  millisecondsToWeeks,
  millisecondsToMonths,    
  millisecondsToYears,
} from '../../../../../shared/ui/utils'

import { BN } from 'web3-utils'
import {
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT,
} from '../../utils/constants'
import { networkContextType } from '../../../../../shared/ui'
import { useAragonApi } from '../../api-react'
import { IdentityProvider } from '../../../../../shared/identity'

const CONVERT_API_BASE = 'https://min-api.cryptocompare.com/data'
const CONVERT_THROTTLE_TIME = 5000

const convertApiUrl = symbols =>
  `${CONVERT_API_BASE}/price?fsym=USD&tsyms=${symbols.join(',')}`

class App extends React.Component {
  static propTypes = {
    api: PropTypes.object,
    rewards: PropTypes.arrayOf(PropTypes.object).isRequired,
    myRewards: PropTypes.arrayOf(PropTypes.object).isRequired,
    metrics: PropTypes.arrayOf(PropTypes.object).isRequired,
    myMetrics: PropTypes.arrayOf(PropTypes.object).isRequired,
    balances: PropTypes.arrayOf(PropTypes.object),
    network: PropTypes.object,
    userAccount: PropTypes.string.isRequired,
    connectedAccount: PropTypes.string.isRequired,
    displayMenuButton: PropTypes.bool.isRequired,
    refTokens: PropTypes.array.isRequired,
    amountTokens: PropTypes.array.isRequired,
    claims: PropTypes.object.isRequired,
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
    claims: {},
    userAccount: '',
    refTokens: [],
    balances: [],
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
    this.props.api && this.props.api.trigger('RefreshRewards', {
      userAddress: this.props.connectedAccount,
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
        amountTokens: this.props.amountTokens,
        app: this.props.api,
        network: this.props.network,
        fundsLimit: this.props.fundsLimit,
      },
    })
  }

  onNewReward = async reward => {
    let currentBlock = await this.props.api.web3Eth('getBlockNumber').toPromise()
    const amountBN = new BN(reward.amount)
    const tenBN =  new BN(10)
    const decimalsBN = new BN(reward.amountToken.decimals)
    reward.amount = amountBN.mul(tenBN.pow(decimalsBN))
    let startBlock = currentBlock + millisecondsToBlocks(Date.now(), reward.dateStart)
    if (reward.rewardType === ONE_TIME_DIVIDEND || reward.rewardType === ONE_TIME_MERIT) {
      reward.occurances = 1
    }
    if (reward.rewardType === ONE_TIME_MERIT) {
      reward.isMerit = true
      reward.delay = 0
      reward.duration = millisecondsToBlocks(reward.dateStart, reward.dateEnd)
    } else {
      reward.isMerit = false
    }
    if (!reward.isMerit) {
      switch (reward.disbursementUnit) {
      case 'Days':
        reward.occurances = millisecondsToDays(reward.dateStart, reward.dateEnd)
        reward.duration = millisecondsToBlocks(Date.now(), MILLISECONDS_IN_A_DAY + Date.now())
        break
      case 'Weeks':
        reward.occurances = millisecondsToWeeks(reward.dateStart, reward.dateEnd)
        reward.duration = millisecondsToBlocks(Date.now(), MILLISECONDS_IN_A_WEEK + Date.now())
        break
      case 'Years':
        reward.occurances = millisecondsToYears(reward.dateStart, reward.dateEnd)
        reward.duration = millisecondsToBlocks(Date.now(), MILLISECONDS_IN_A_YEAR + Date.now())
        break                
      default: // Monthly
        reward.occurances = millisecondsToMonths(reward.dateStart, reward.dateEnd)
        reward.duration = millisecondsToBlocks(Date.now(), MILLISECONDS_IN_A_MONTH + Date.now())
      }
    }
    this.props.api.newReward(
      reward.description, //string _description
      reward.isMerit, //reward.isMerit, //bool _isMerit,
      reward.referenceAsset.key, //address _referenceToken,
      reward.amountToken.address, //address _rewardToken,
      reward.amount.toString(10), //uint _amount,
      startBlock, // uint _startBlock
      reward.duration, //uint _duration, (number of blocks until reward will be available)
      reward.occurances, //uint _occurances,
      0 //uint _delay
    ).toPromise()
    this.closePanel()
  }

  onClaimReward = reward => {
    this.props.api.claimReward(Number(reward.rewardId)).toPromise()
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
      panelProps: reward,
    })
  }

  openDetailsView = reward => {
    this.viewReward(reward)
  }
  openDetailsMy = reward => {
    this.myReward(reward)
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
    const Wrapper = ({ children }) => (
      <Main>
        <IdentityProvider
          onResolve={this.handleResolveLocalIdentity}
          onShowLocalIdentityModal={this.handleShowLocalIdentityModal}>
          { children }
          <PanelManager
            onClose={this.closePanel}
            activePanel={this.state.panel}
            {...this.state.panelProps}
          />
        </IdentityProvider>
      </Main>
    )

    const { rewards, myRewards } = this.props

    if (!rewards && !myRewards) {
      return (
        <Wrapper>
          <EmptyContainer>
            <Empty action={this.newReward} />
          </EmptyContainer>
        </Wrapper>
      )
    }

    return (
      <Wrapper>
        <Header
          primary="Rewards"
          secondary={
            <Button
              mode="strong"
              icon={<IconPlus />}
              onClick={this.newReward}
              label="New Reward"
            />
          }
        />
        <Tabs
          items={this.state.tabs}
          selected={this.state.selected}
          onChange={this.selectTab}
        />

        { this.state.selected === 1 ? (
          <MyRewards
            myRewards={this.props.myRewards}
            myMetrics={this.props.myMetrics}
          />
        ) : (
          <Overview
            rewards={this.props.rewards === undefined ? [] : this.props.rewards}
            newReward={this.newReward}
            viewReward={this.viewReward}
            metrics={this.props.metrics}
          />
        )}
      </Wrapper>
    )
  }
}

const EmptyContainer = styled.div`
  display: flex;
  height: 80vh;
  align-items: center;
`

// eslint-disable-next-line react/display-name
export default () => {
  const { api, appState, connectedAccount, displayMenuButton } = useAragonApi()
  return <App api={api} {...appState} connectedAccount={connectedAccount} displayMenuButton={displayMenuButton} />
}
