import React, { PureComponent } from 'react'
import styled from 'styled-components'

const StyledTabbedView = styled.div`
  position: absolute;
  height: calc(100% - 64px);
  width: 100%;
  display: flex;
  flex-direction: column;
`

export default class TabbedView extends PureComponent {
  render() {
    const children = React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        activeIndex: this.props.activeIndex,
        onSelectTab: this.props.changeActiveIndex,
      })
    })
    return <StyledTabbedView>{children}</StyledTabbedView>
  }
}
