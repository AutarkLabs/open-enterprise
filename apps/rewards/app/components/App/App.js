import { AragonApp, observe, SidePanel, TabBar } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Title } from '../Shared'
import { Empty } from '../Card'
import PanelManager, { PANELS } from '../Panel'
import NewRewardButton from './NewRewardButton'

const ASSETS_URL = 'aragon-ui-assets/'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    rewards: PropTypes.arrayOf(PropTypes.object),
  }

  onNewReward = reward => {
    console.log('Create New Reward from', reward)
    this.closePanel()
  }

  state = {
    selected: 0,
    rewardsEmpty: this.props.rewards === undefined || this.props.rewards === [],
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

  render() {
    const { panel, panelProps } = this.state

    return (
      <StyledAragonApp>
        <Title text="Rewards" />
        <NewRewardButton onClick={this.newReward} />
        <TabBar
          items={[ 'Overview', 'My Rewards' ]}
          selected={this.state.selected}
          onSelect={this.selectTab}
        />

        {this.state.rewardsEmpty ?
          <Empty action={this.newReward} />
          :
          'Rewards Exist'
        }

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
