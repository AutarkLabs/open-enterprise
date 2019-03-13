import { AragonApp, observe, SidePanel, TabBar } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Overview, MyRewards } from '../Content'
import { Title } from '../Shared'
import { ViewReward } from '../Panel'

const ASSETS_URL = 'aragon-ui-assets/'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    rewards: PropTypes.arrayOf(PropTypes.object),
  }

  state = {
    selected: 0,
    tabs: [ 'Overview', 'My Rewards' ],
    panel: {
      visible: true,
      content: ViewReward,
      data: { heading: 'Reward #0' }
    }
  }

  closePanel = () => {
    this.setState({ panel: { visible: false } })
  }

  selectTab = idx => {
    this.setState({ selected: idx })
  }

  onNewReward = () => {
    console.log('Create New Reward')
  }

  viewReward = (reward) => {
    this.setState({
      panel: {
        visible: true,
        content: ViewReward,
        data: { heading: reward.title, reward: reward }

      }
    })
  }

  render() {
    const { panel } = this.state
    const PanelContent = panel.content
    return (
      <StyledAragonApp>
        <Title text="Rewards" />
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
        <SidePanel
          title={(panel.data && panel.data.heading) || ''}
          opened={panel.visible}
          onClose={this.closePanel}
        >
          {panel.content && <PanelContent {...panel.data} />}
        </SidePanel>
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
