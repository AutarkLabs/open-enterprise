import { AragonApp, observe, SidePanel, Table, TableHeader, TableRow, TableCell, Text, SafeLink, ContextMenu, ContextMenuItem, Badge } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'styled-components'
import { Empty } from '../Card'
import isAddress from 'web3-utils'

import NewEntityButton from './NewEntityButton'
import NewEntity from '../Panel/NewEntity'

import { Title } from '../Shared'

const ASSETS_URL = 'aragon-ui-assets/'
// TODO: colors taken directly from Invision
const ENTITY_TYPES = [
  { name: 'Individual', fg: '#76A4E5', bg: '#CDECFF' },
  { name: 'Organisation', fg: '#E5B243', bg: '#F6E4B0' },
  { name: 'Project', fg: '#EE5BF1', bg: '#EDD0F2' }
]

const Entities = ({
  entities,
  onNewEntity
}) => {
  if (entities.length === 0) {
    return <Empty action={onNewEntity} />
  } else {
    return (
      <Table
        header={
          <TableRow>
            <TableHeader title="Entity" />
          </TableRow>
        }
      >
      {
        entities.map(ent => {
          const eType = ENTITY_TYPES[ent.eType]
          return (
            <TableRow key={ent.eAddress}>
              <TableCell>

<div>
                <Text>{ent.eName}</Text>
</div>
<div>
                <SafeLink style={{ color: '#21AAE7' }} href={"#"}>
                  {ent.eAddress}
                </SafeLink>
</div>
              </TableCell>
              <TableCell>
                <Badge foreground={eType.fg} background={eType.bg}>{eType.name}</Badge>
              </TableCell>
              <TableCell>
                <ContextMenu>
<ContextMenuItem>Edit</ContextMenuItem>
<ContextMenuItem>Remove</ContextMenuItem>
                </ContextMenu>
              </TableCell>
            </TableRow>
          )})
      }
      </Table>
    )
  }
}

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
    this.setState({ entity })

    this.props.app.addEntry(entity.eName, entity.eAddress, entity.eType)

    this.closePanel()
    console.info('App.js: Entity Created: ', entity.eName)
    console.table(entity)
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
            <Entities entities={entities} onNewEntity={this.newEntity} />
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

