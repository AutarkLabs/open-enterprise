import { AragonApp, observe, SidePanel } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'
import Entities from './Entities'
import NewEntityButton from './NewEntityButton'
import NewEntity from '../Panel/NewEntity'
import { Title } from '../Shared'

const ASSETS_URL = 'aragon-ui-assets/'

class App extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    entities: PropTypes.arrayOf(PropTypes.object),
  }

  state = {
    entities: [{eName: 'test1', eAddress: '0x9876534251783930048725651738894', eType: 1}],
    panel: {
      visible: false,
    },
  }

  createEntity = entity => {
// temp workaround
    var { entities } = this.state
    entities.push(entity)
    this.setState({ entities })

    this.props.app.addEntry(entity.eName, entity.eAddress, entity.eType)

    this.closePanel()
    console.info('App.js: Entity Created: ', entity.eName)
    console.table(entity)
  }

  removeEntity = eAddress => {
// temp workaround
    var { entities } = this.state
    const e2 = entities.filter(entity => entity.eAddress !== eAddress)
    this.setState({ entities: e2 })

    this.props.app.removeEntry(eAddress)

    console.info('App.js: Entity removed: ', eAddress)
  }

  newEntity = () => {
    this.setState({
      panel: {
        visible: true,
        content: NewEntity,
        data: { heading: 'New entity', onCreateEntity: this.createEntity },
      },
    })
  }

  closePanel = () => {       
    this.setState({ panel: { visible: false } })
  }

  render() {
    const { panel, entities } = this.state
    const PanelContent = panel.content
    return (

      <StyledAragonApp>
        <Title text="Address Book" />
        <NewEntityButton onClick={this.newEntity} />

        <ScrollWrapper>
          <Content>
            <Entities entities={entities} onNewEntity={this.newEntity} onRemoveEntity={this.removeEntity} />
          </Content>
        </ScrollWrapper>
        
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
  observable => observable.map(state => ({ ...state })),
  {}
)(hot(module)(App))

