import PropTypes from 'prop-types'
import React from 'react'

import {
  ContextMenu,
  ContextMenuItem,
  DataView,
  Tag,
  Text,
  useTheme,
} from '@aragon/ui'

import LocalIdentityBadge from '../LocalIdentityBadge/LocalIdentityBadge'
import { IconDelete } from '../../../../../shared/ui'

const entitiesSort = (a, b) => a.data.name.toUpperCase() > b.data.name.toUpperCase() ? 1 : -1

const Entities = ({ entities, onRemoveEntity }) => {
  const theme = useTheme()
  const ENTITY_TYPES = [
    { name: 'Individual', fg: theme.tagIdentifierContent, bg: theme.tagIdentifier },
    { name: 'Organization', fg: theme.warningSurfaceContent, bg: theme.warningSurface },
  ]
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
            entity={entryAddress}
          />,
          <Tag
            style={{
              fontWeight: 1000
            }}
            key={entryAddress}
            mode="identifier"
            color={typeRow.fg}
            background={typeRow.bg}
          >
            {typeRow.name}
          </Tag>
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
