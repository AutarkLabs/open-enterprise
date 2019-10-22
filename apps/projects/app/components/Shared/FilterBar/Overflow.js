import React from 'react'
import PropTypes from 'prop-types'

import { theme, Viewport } from '@aragon/ui'

import FilterDropDown from './FilterDropDown'

const apprxItemWidth = 150

// If the available space is, say, 290 px wide, we would show one item in
// addition to the overflow item (290 ÷ 150).
// Instead, we subtract this number so that we show only the overflow starting
// at 400px available width.
// Note that Viewport measures the *page width*, not the *available space*
// width, so this number needs to be large enough to account for page padding
// and other buttons.
const spacer = 250

const splice = (children, ...args) => (
  React.Children.toArray(children).splice(...args)
)

const Overflow = ({ children }) => (
  <Viewport>
    {({ width }) => {
      const shown = Math.floor((width - spacer) / apprxItemWidth)
      const elements = splice(children, 0, shown)

      if (children.length > shown) {
        elements.push(
          <FilterDropDown
            key="overflow"
            caption={shown ? 'More Filters' : 'Filters'}
            enabled
            type="overflow"
            width="100%"
            style={{
              border: 'none',
              display: 'grid',
              padding: '1px',
              gridGap: '1px',
              background: theme.contentBorder,
              gridTemplateRows: 'repeat(auto-fit, minmax(0, 1fr))',
            }}
          >
            {splice(children, shown)}
          </FilterDropDown>
        )
      }

      return elements
    }}
  </Viewport>
)

Overflow.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Overflow

