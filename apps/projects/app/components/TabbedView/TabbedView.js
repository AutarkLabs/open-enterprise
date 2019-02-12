import React, { PureComponent } from 'react'
import styled from 'styled-components'

const StyledTabbedView = styled.div`
  height: calc(100vh - 64px);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
`

export default class TabbedView extends PureComponent {
  render() {
    const children = React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        activeIndex: this.props.activeIndex,
        changeActiveIndex: this.props.changeActiveIndex,
      })
    })
    return <StyledTabbedView>{children}</StyledTabbedView>
  }
}
