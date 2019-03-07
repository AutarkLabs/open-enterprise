import React from 'react'
import styled from 'styled-components'
import { theme } from '@aragon/ui'

const StyledTabBar = styled.nav`
  line-height: 31px;
  padding-left: 30px;
  background: ${theme.contentBackground};
  border-bottom: 1px solid ${theme.contentBorder};
`

const TabBar = props => {
  const { activeIndex, children, changeActiveIndex } = props
  const tabs = React.Children.map(children, (child, index) =>
    React.cloneElement(child, {
      isActive: index === activeIndex.tabIndex,
      onSelect: () => changeActiveIndex({ tabIndex: index, tabData: {} }),
    })
  )
  return <StyledTabBar>{tabs}</StyledTabBar>
}

export default TabBar
