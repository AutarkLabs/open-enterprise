import React, { PureComponent } from 'react'
import styled from 'styled-components'

const StyledTabContent = styled.main`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
  overflow: auto;
  flex-grow: 1;
`

export default class TabContent extends PureComponent {
  render() {
    const { activeIndex } = this.props
    return <StyledTabContent>{this.props.children[activeIndex]}</StyledTabContent>
  }
}
