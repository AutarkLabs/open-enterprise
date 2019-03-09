import { AragonApp, observe, SidePanel, TabBar } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Title } from '../Shared'

const ASSETS_URL = 'aragon-ui-assets/'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    accounts: PropTypes.arrayOf(PropTypes.object),
  }

  state = {
    selected: 0,
  }

  closePanel = () => {
    this.setState({ panel: { visible: false } })
  }

  selectTab = idx => {
    this.setState({selected: idx})
  }

  render() {

    return (
      <StyledAragonApp>
        <Title text="Rewards" />
        <TabBar
          items={['Overview', 'My Rewards']}
          selected={this.state.selected}
          onSelect={this.selectTab}
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
