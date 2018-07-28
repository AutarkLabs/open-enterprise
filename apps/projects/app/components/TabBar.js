import React from 'react'
import styled from 'styled-components'
import { theme } from '@aragon/ui'

const StyledTabBar = styled.nav`
  line-height: 31px;
  padding-left: 30px;
  background: ${theme.contentBackground};
  border-bottom: 1px solid ${theme.contentBorder};
`

export const TabBar = props => {
  const { activeIndex } = props
  const children = React.Children.map(props.children, (child, index) => {
    return React.cloneElement(child, {
      isActive: index === activeIndex,
      onSelect: () => props.onSelectTab(index),
    })
  })
  return <StyledTabBar>{children}</StyledTabBar>
}
