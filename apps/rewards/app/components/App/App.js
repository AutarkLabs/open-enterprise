import { AragonApp, observe, SidePanel, TabBar } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Title } from '../Shared'
import { Empty } from '../Card'

const ASSETS_URL = 'aragon-ui-assets/'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    rewards: PropTypes.arrayOf(PropTypes.object),
  }

  state = {
    selected: 0,
    rewardsEmpty: this.props.rewards === undefined || this.props.rewards === []
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

  render() {

    return (
      <StyledAragonApp>
        <Title text="Rewards" />
        <TabBar
          items={[ 'Overview', 'My Rewards' ]}
          selected={this.state.selected}
          onSelect={this.selectTab}
        />

        {this.state.rewardsEmpty ?
          <Empty action={this.onNewReward} />
          :
          'Rewards Exist'
        }
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
