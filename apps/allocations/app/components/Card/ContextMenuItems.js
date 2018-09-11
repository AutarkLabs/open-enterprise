import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import {
  ContextMenu,
  ContextMenuItem,
  IconSettings,
  IconAdd,
  theme,
} from '@aragon/ui'

// import ContextMenu from './ContextMenu'

const contextMenuItems = [
  {
    text: 'New Allocation',
    icon: IconAdd,
    action: 'newAllocation',
    colors: {
      iconColor: theme.textTertiary,
      labelColor: theme.textPrimary,
    },
  },
  {
    text: 'Manage Parameters',
    // TODO: Put the right icon here
    icon: IconSettings,
    action: 'manageParameters',
    colors: { iconColor: theme.accent },
  },
]

const ContextMenuItems = ({ actions }) => {
  const mappedItems = contextMenuItems.map(
    ({ text, action, colors, icon: Icon }) => (
      <StyledMenuItem key={text} onClick={actions[action]} colors={colors}>
        <Icon />
        {text}
      </StyledMenuItem>
    )
  )
  return <ContextMenu>{mappedItems}</ContextMenu>
}

ContextMenuItems.propTypes = {
  // TODO: Upgrade to shape
  actions: PropTypes.objectOf(PropTypes.func).isRequired,
}

const StyledMenuItem = styled(ContextMenuItem).attrs({
  iconColor: props => props.colors.iconColor || theme.textPrimary,
  labelColor: props => props.colors.labelColor || props.colors.iconColor,
})`
  color: ${props => props.labelColor};
  font-weight: bold;
  width: 248px;
  & > :first-child {
    margin-right: 15px;
    color: ${props => props.iconColor};
  }
`

export default ContextMenuItems
