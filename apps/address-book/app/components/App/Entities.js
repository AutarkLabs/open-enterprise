import { Table, TableHeader, TableRow, TableCell, Text, SafeLink, ContextMenu, ContextMenuItem, Badge } from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Empty } from '../Card'
import isAddress from 'web3-utils'

// TODO: colors taken directly from Invision
const ENTITY_TYPES = [
  { name: 'Individual', fg: '#76A4E5', bg: '#CDECFF' },
  { name: 'Organisation', fg: '#E5B243', bg: '#F6E4B0' },
  { name: 'Project', fg: '#EE5BF1', bg: '#EDD0F2' }
]

const Entities = ({
  entities,
  onNewEntity,
  onRemoveEntity
}) => {
  const removeEntity = (eAddress) => () => onRemoveEntity(eAddress)

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
                <EntityCell>
                  <EntityWrapper>
                    <Text>{ent.eName}</Text>
                    <SafeLink style={{ color: '#21AAE7' }} href={'#'}>
                      {ent.eAddress}
                    </SafeLink>
                  </EntityWrapper>
                </EntityCell>
                <EntityCell align="center">
                  <Badge foreground={eType.fg} background={eType.bg}>{eType.name}</Badge>
                </EntityCell>
                <EntityCell>
                  <ContextMenu>
                    <ContextMenuItem onClick={removeEntity(ent.eAddress)}>Remove</ContextMenuItem>
                  </ContextMenu>
                </EntityCell>
              </TableRow>
            )})
        }
      </Table>
    )
  }
}

Entities.propTypes = {
  entities: PropTypes.array.isRequired,
  onNewEntity: PropTypes.func.isRequired,
  onRemoveEntity: PropTypes.func.isRequired
}

const EntityCell = styled(TableCell)`
  padding: 10px;
`
const EntityWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 10px;
`
export default Entities

