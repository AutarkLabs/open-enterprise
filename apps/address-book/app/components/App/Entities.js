import PropTypes from 'prop-types'
import React from 'react'

import { useNetwork } from '../../api-react'
import {
  Badge,
  ContextMenu,
  ContextMenuItem,
  DataView,
  Text,
} from '@aragon/ui'

import { LocalIdentityBadge } from '../../../../../shared/identity'
import { IconDelete } from '../../../../../shared/ui'

// TODO: colors taken directly from Invision
const ENTITY_TYPES = [
  { name: 'Individual', fg: '#76A4E5', bg: '#76A4E533' },
  { name: 'Organization', fg: '#F78308', bg: '#F7830833' },
  { name: 'Project', fg: '#B30FB3', bg: '#B30FB333' },
]

const entitiesSort = (a, b) => a.data.name.toUpperCase() > b.data.name.toUpperCase() ? 1 : -1

const Entities = ({ entities, onRemoveEntity }) => {
  const network = useNetwork()
  const removeEntity = address => () => onRemoveEntity(address)

  return (
    <DataView
      mode="adaptive"
      fields={[ 'Name', 'Address', 'Type' ]}
      entries={
        entities.sort(entitiesSort).map(({ addr: entryAddress, data: { name, type: entryType } }) =>
          [ name, entryAddress, entryType ]
        )
      }

      renderEntry={([ name, entryAddress, entryType ]) => {
        const typeRow = ENTITY_TYPES.filter(row => row.name === entryType)[0]
        const values = [
          <Text
            key={entryAddress}
            size="large"
          >
            {name}
          </Text>,
          <LocalIdentityBadge
            key={entryAddress}
            networkType={network && network.type}
            entity={entryAddress}
            shorten={true}
          />,
          <Badge
            key={entryAddress}
            foreground={typeRow.fg}
            background={typeRow.bg}
            css="text-align: right"
          >
            {typeRow.name}
          </Badge>
        ]
        return values
      }}

      renderEntryActions={([ , entryAddress ]) => (
        <ContextMenu>
          <ContextMenuItem onClick={removeEntity(entryAddress)}>
            <IconDelete />
            <span css="padding: 4px 8px 0px">Remove</span>
          </ContextMenuItem>
        </ContextMenu>
      )}
    />
  )
}

Entities.propTypes = {
  // TODO: shape better
  entities: PropTypes.array.isRequired,
  onRemoveEntity: PropTypes.func.isRequired,
}

export default Entities