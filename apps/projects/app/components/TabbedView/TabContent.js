import React, { PureComponent } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const StyledTabContent = styled.main`
  overflow-x: hidden;
  flex-grow: 1;
`

export default class TabContent extends PureComponent {
  static propTypes = {
    activeIndex: PropTypes.number.isRequired,
    children: PropTypes.node.isRequired,
  }

  static defaultProps = {
    activeIndex: 0,
  }

  render() {
    const { activeIndex, children } = this.props
    return <StyledTabContent>{children[activeIndex]}</StyledTabContent>
  }
}
