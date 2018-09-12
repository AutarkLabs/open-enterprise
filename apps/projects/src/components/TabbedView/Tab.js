import React from 'react'
import styled from 'styled-components'
import { Text, theme, unselectable } from '@aragon/ui'

// TODO: style state: hover, element active, etc
const StyledTab = styled.div`
  ${unselectable};
  padding-top: 4px;
  display: inline-block;
  cursor: pointer;
  height: 37px;
  margin-right: 50px;
  transition: all 0.5s cubic-bezier(0.38, 0.8, 0.32, 1.07);
  &.active {
    cursor: default;
    text-shadow: 0.1px 0 0 ${theme.textPrimary}, -0.1px 0 0 ${theme.textPrimary};
    border-bottom: 4px solid ${theme.accent};
  }
  &:hover:not(.active) {
    color: ${theme.textSecondary};
  }
`

const Tab = props => {
  const { children, isActive, onSelect } = props
  return (
    <StyledTab className={isActive && 'active'} onClick={onSelect}>
      <Text>{children}</Text>
    </StyledTab>
  )
}

export default Tab
