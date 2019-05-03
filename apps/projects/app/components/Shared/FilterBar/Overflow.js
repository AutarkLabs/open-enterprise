import React from 'react'
import styled from 'styled-components'

import FilterButton from './FilterButton'
import DotsDropDown from './DotsDropDown'


class Overflow extends React.Component {

  // This splice does not directly mutate props since toArray generates new object
  splice = (...args) =>
    React.Children.toArray(this.props.children).splice(...args)

  render() {
    const { showFilters } = this.props
    const visibleElements = this.splice(0, showFilters)
    const overflowElements = this.splice(showFilters)
    return (
      <div
        ref={this.props.theRef}
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
            <DotsDropDown
              enabled={true}
            >
              {overflowElements}
            </DotsDropDown>
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

