import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
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
  static propTypes = {
    activeIndex: PropTypes.number.isRequired,
    changeActiveIndex: PropTypes.func.isRequired,
    children: PropTypes.node,
  }
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
