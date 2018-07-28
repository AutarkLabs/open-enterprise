import React, { PureComponent } from 'react'
import styled from 'styled-components'

const StyledTabbedView = styled.div`
  position: absolute;
  height: calc(100% - 63px);
  width: 100%;
  display: flex;
  flex-direction: column;
`

export default class TabbedView extends PureComponent {
  state = {
    activeIndex: 0,
  }

  selectTabIndex(activeIndex) {
    this.setState({ activeIndex })
  }

  render() {
    const children = React.Children.map(this.props.children, child => {
      return React.cloneElement(child, {
        activeIndex: this.state.activeIndex,
        onSelectTab: this.selectTabIndex.bind(this),
      })
    })
    return <StyledTabbedView>{children}</StyledTabbedView>
  }
}
