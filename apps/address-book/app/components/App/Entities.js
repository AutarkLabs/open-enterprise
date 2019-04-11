import {
  Badge,
  ContextMenu,
  ContextMenuItem,
  IdentityBadge,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Text,
  theme,
} from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Empty } from '../Card'
import { provideNetwork } from '../../../../../shared/ui'

// TODO: colors taken directly from Invision
const ENTITY_TYPES = [
  { name: 'Individual', fg: '#76A4E5', bg: '#76A4E533' },
  { name: 'Organization', fg: '#F78308', bg: '#F7830833' },
  { name: 'Project', fg: '#B30FB3', bg: '#B30FB333' },
]

const Entities = ({ entities, network, onNewEntity, onRemoveEntity }) => {
  const removeEntity = address => () => onRemoveEntity(address)

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
        {entities.map(({ data: { name, entryAddress, entryType } }) => {
          const typeRow = ENTITY_TYPES.filter(row => row.name === entryType)[0]
          return (
            <TableRow key={entryAddress}>
              <EntityCell>
                <EntityWrapper>
                  <Text
                    size="xlarge"
                    style={{
                      paddingBottom: '5px',
                    }}
                  >
                    {name}
                  </Text>
                  <IdentityBadge
                    networkType={network.type}
                    entity={entryAddress}
                    shorten={true}
                  />
                </EntityWrapper>
              </EntityCell>
              <EntityCell align="right">
                <Badge foreground={typeRow.fg} background={typeRow.bg}>
                  {typeRow.name}
                </Badge>
              </EntityCell>
              <EntityCell
                align="right"
                style={{
                  width: '30px',
                }}
              >
                <ContextMenu>
                  <ContextMenuItem onClick={removeEntity(entryAddress)}>
                    Remove
                  </ContextMenuItem>
                </ContextMenu>
              </EntityCell>
            </TableRow>
          )
        })}
      </Table>
    )
  }
}

Entities.propTypes = {
  // TODO: shape better
  entities: PropTypes.array.isRequired,
  network: PropTypes.object,
  onNewEntity: PropTypes.func.isRequired,
  onRemoveEntity: PropTypes.func.isRequired,
}

const EntityCell = styled(TableCell)`
  padding: 15px;
`
const EntityWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 10px;
`
export default provideNetwork(Entities)
