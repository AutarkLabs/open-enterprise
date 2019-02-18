import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  Text,
  SafeLink,
  ContextMenu,
  ContextMenuItem,
  Badge,
} from '@aragon/ui'
import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Empty } from '../Card'
import isAddress from 'web3-utils'
import icon from '../../assets/copy.svg'

const CopyIcon = () => <img src={icon} alt="Copy address to the clipboard" />

// TODO: colors taken directly from Invision
const ENTITY_TYPES = [
  { name: 'Individual', fg: '#76A4E5', bg: '#CDECFF' },
  { name: 'Organization', fg: '#E5B243', bg: '#F6E4B0' },
  { name: 'Project', fg: '#EE5BF1', bg: '#EDD0F2' },
]

const Entities = ({ entities, onNewEntity, onRemoveEntity }) => {
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
                  <Text>{name}</Text>
                  <div style={{ display: 'flex' }}>
                    <SafeLink
                      style={{ color: '#21AAE7' }}
                      // TODO: Populate the rinkeby depending on the deployment network. TIP: use href.location for that
                      href={`https://rinkeby.etherscan.io/address/${entryAddress}`}
                      target="_blank"
                      title={entryAddress}
                    >
                      {entryAddress}
                    </SafeLink>
                    <span
                      onClick={() => {
                        navigator.clipboard.writeText(entryAddress)
                      }}
                      style={{ marginLeft: '.5rem', cursor: 'pointer' }}
                    >
                      <CopyIcon />
                    </span>
                  </div>
                </EntityWrapper>
              </EntityCell>
              <EntityCell align="center">
                <Badge foreground={typeRow.fg} background={typeRow.bg}>
                  {typeRow.name}
                </Badge>
              </EntityCell>
              <EntityCell>
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
  onNewEntity: PropTypes.func.isRequired,
  onRemoveEntity: PropTypes.func.isRequired,
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
