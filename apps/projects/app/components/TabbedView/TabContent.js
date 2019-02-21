import React, { PureComponent } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const StyledTabContent = styled.main`
  overflow: hidden;
  flex-grow: 1;
`

export default class TabContent extends PureComponent {
  static propTypes = {
    activeIndex: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
  }

  static defaultProps = {
    activeIndex: { tabIndex: 0, tabData: {}},
  }

  render() {
    const { activeIndex, children } = this.props
    return <StyledTabContent>{children[activeIndex.tabIndex]}</StyledTabContent>
  }
}
