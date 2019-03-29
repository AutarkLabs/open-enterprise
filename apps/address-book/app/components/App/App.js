import { Main, observe, SidePanel } from '@aragon/ui'
import { hot } from 'react-hot-loader'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { map } from 'rxjs/operators'

import { appStyle, networkContextType } from '../../../../../shared/ui'
import NewEntity from '../Panel/NewEntity'
import { Title } from '../Shared'
import Entities from './Entities'
import NewEntityButton from './NewEntityButton'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    // TODO: Shape this
    entities: PropTypes.arrayOf(PropTypes.object),
  }

  static defaultProps = {
    network: {},
  }

  static childContextTypes = {
    network: networkContextType,
  }

  state = {
    panelVisible: false,
  }

  getChildContext() {
    const { network } = this.props
    return {
      network: {
        type: network.type,
      },
    }
  }

  createEntity = entity => {
    this.props.app.addEntry(entity.address, entity.name, entity.type)
    this.closePanel()
  }

  removeEntity = address => {
    this.props.app.removeEntry(address)
  }

  newEntity = () => {
    this.setState({
      panelVisible: true,
    })
  }

  closePanel = () => {
    this.setState({ panelVisible: false })
  }

  render() {
    const { panelVisible } = this.state
    const { entries } = this.props

    return (
      <Main style={appStyle}>
        <Title text="Address Book" />
        <NewEntityButton onClick={this.newEntity} />

        <ScrollWrapper>
          <Content>
            <Entities
              entities={entries ? entries : []}
              onNewEntity={this.newEntity}
              onRemoveEntity={this.removeEntity}
            />
          </Content>
        </ScrollWrapper>

        <SidePanel
          title="New entity"
          opened={panelVisible}
          onClose={this.closePanel}
        >
          <NewEntity onCreateEntity={this.createEntity} />
        </SidePanel>
      </Main>
    )
  }
}

const ScrollWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  overflow: auto;
  flex-grow: 1;
`
const Content = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  flex-grow: 1;
`
export default observe(
  observable => observable.pipe(map(state => ({ ...state }))),
  {}
)(hot(module)(App))
