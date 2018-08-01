import React, { PureComponent } from 'react'
import styled from 'styled-components'

const StyledTabContent = styled.main`
  overflow-x: hidden;
  flex-grow: 1;
`

export default class TabContent extends PureComponent {
  render() {
    const { activeIndex } = this.props
    return (
      <StyledTabContent>{this.props.children[activeIndex]}</StyledTabContent>
    )
  }
}
