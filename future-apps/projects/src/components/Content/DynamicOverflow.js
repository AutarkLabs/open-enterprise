import React from 'react'
import PropTypes from 'prop-types'

class DynamicOverflow extends React.Component {
  state = {
    numberOfVisibleElements: Infinity,
  }
  componentDidMount() {
    window.addEventListener('resize', this.handleResize)
    this.calculateSize()
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }
  calculateSize = () => {
    const containerWidth = this.containerNode && this.containerNode.clientWidth
    const firstChildWidth = this.tabNode && this.tabNode.clientWidth

    const maximumChildrenAllowed =
      Math.floor(containerWidth / firstChildWidth) - 1
    const currentChildrenCount = this.props.list({}).length

    let numberOfVisibleElements = Infinity
    if (currentChildrenCount > maximumChildrenAllowed) {
      // by default, one element is always shown
      numberOfVisibleElements = Math.max(maximumChildrenAllowed, 1)
    }

    this.setState({ numberOfVisibleElements })
  }
  handleResize = () => {
    setTimeout(this.calculateSize(), 250)
  }

  containerRef = node => {
    if (!this.containerNode) {
      this.containerNode = node
    }
  }

  tabRef = node => {
    if (!this.tabNode) {
      this.tabNode = node
    }
  }

  render() {
    const { numberOfVisibleElements } = this.state
    const { list, children } = this.props
    const { containerRef, tabRef } = this

    const elements = list({ tabRef })
    const visibleElements = elements.slice(0, numberOfVisibleElements)
    const overflowElements = elements.slice(numberOfVisibleElements)

    return children({
      visibleElements,
      overflowElements,
      containerRef,
    })
  }
}

DynamicOverflow.propTypes = {
  children: PropTypes.func,
  list: PropTypes.func,
  //   throttle: PropTypes.number
}

// DynamicOverflow.defaultProps = {
//   throttle: 200
// };

export default DynamicOverflow
