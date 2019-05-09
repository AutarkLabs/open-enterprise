import React from 'react'
import styled from 'styled-components'

import FilterButton from './FilterButton'
import FilterDropDown from './FilterDropDown'


class Overflow extends React.Component {
  state = {
    shown: Infinity,
    childrenLength: React.Children.toArray(this.props.children).length,
  }

  // TODO: pass ref as prop?
  theRef = React.createRef()

  componentDidMount() {
    window.addEventListener('resize', this.resize)
    this.calculateItems()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize)
  }

  resize = () => {
    this.debounced(200, this.calculateItems)
  }

  debounced = (delay, fn) => {
    let timerId
    if (timerId) {
      clearTimeout(timerId)
    }

    timerId = setTimeout(() => {
      fn()
      timerId = null
    }, delay)
  }

  calculateItems = () => {
    const containerWidth = this.theRef.current
      ? this.theRef.current.clientWidth
      : 0

    const itemWidth = 150
    let shown = Math.floor((containerWidth) / itemWidth)
    if (shown < this.state.childrenLength) {
      if (containerWidth < shown * itemWidth + 62) shown--
    }
    this.setState({ shown })
  }

  // This splice does not directly mutate props since toArray generates new object
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
          height: '40px',
          //overflow: 'hidden',
          display: 'flex',
        }}
      >
        {visibleElements}
  
        {overflowElements.length === 0 ? (
          <OverflowPlaceholder />
        ) : (
          <OverflowVertical>
            <FilterDropDown
              enabled={true}
              type="overflow"
              width="212px"
            >
              {overflowElements}
            </FilterDropDown>
          </OverflowVertical>
        )}
      </div>
    )
  }
}

const OverflowVertical = styled.div`
  display: flex;
  flex-direction: column;
`
const OverflowPlaceholder = styled(FilterButton)`
  /*margin-left: -1px;*/
  width: 100%;
  min-width: 1px;
  box-shadow: none;
  border-left: 0;
  padding: 0;
  :hover {
    box-shadow: none;
  }
`

export default Overflow

