import { observe, SidePanel, Main, AppBar, AppView } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'
import { map } from 'rxjs/operators'
import Entities from './Entities'
import NewEntity from '../Panel/NewEntity'
import { networkContextType, AppTitle, AppTitleButton } from '../../../../../shared/ui'

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
    const { entries, displayMenuButton = false } = this.props

    return (
      <Main>
        <AppView
          appBar={
            <AppBar
              endContent={
                <AppTitleButton
                  caption="New Entity"
                  onClick={this.newEntity}
                />
              }
            >
              <AppTitle
                title="Address Book"
                displayMenuButton={displayMenuButton}
                css="padding-left: 30px"
              />
            </AppBar>
          }
        >

          <ScrollWrapper>
            <Entities
              entities={entries ? entries : []}
              onNewEntity={this.newEntity}
              onRemoveEntity={this.removeEntity}
            />
          </ScrollWrapper>

        </AppView>

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
export default observe(
  observable => observable.pipe(map(state => ({ ...state }))),
  {}
)(hot(module)(App))
