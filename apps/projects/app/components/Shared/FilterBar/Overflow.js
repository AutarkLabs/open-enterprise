import React from 'react'

import FilterButton from './FilterButton'

// TODO: document.querySelectorAll(".tab").forEach(e => console.log(e.clientWidth))

class Overflow extends React.Component {
  state = {
    shown: Infinity,
  }

  // TODO: pass ref as prop?
  theRef = React.createRef()

  componentDidMount() {
    window.addEventListener('resize', this.debounced(200, this.calculateItems))
    this.calculateItems()
  }

  componentWillUnmount() {
    window.removeEventListener(
      'resize',
      this.debounced(200, this.calculateItems)
    )
  }

  debounced = (delay, fn) => {
    let timerId
    return () => {
      if (timerId) {
        clearTimeout(timerId)
      }
      timerId = setTimeout(() => {
        fn()
        timerId = null
      }, delay)
    }
  }

  calculateItems = () => {
    const containerWidth = this.theRef.current.clientWidth
    // console.log(containerWidth)

    const itemWidth = 200
    const shown = Math.floor(containerWidth / itemWidth)
    this.setState({ shown })
  }

  splice = (...args) =>
    React.Children.toArray(this.props.children).splice(...args)

  render() {
    const visibleElements = this.splice(0, this.state.shown)
    const overflowElements = this.splice(this.state.shown)
    return (
      <div
        ref={this.theRef}
        style={{
          width: '40px',
          border: '1px solid rgba(209, 209, 209, 0.5)',
          height: '40px',
          margin: '-1px',
          overflow: 'hidden',
        }}
      >
        {visibleElements}
        <FilterButton
          style={{
            display: 'inline-flex',
            justifyContent: 'center',
            width: '40px',
            padding: 0,
          }}
        >
          …
        </FilterButton>
        {/* <FilterButton>...</FilterButton> */}
        {/* {overflowElements} */}
      </div>
    )
  }
}

export default Overflow
