import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import FilterTile from './FilterTile'

export default class Filters extends Component {
  static propTypes = {
    filters: PropTypes.shape({
      projects: PropTypes.object.isRequired,
      labels: PropTypes.object.isRequired,
      milestones: PropTypes.object.isRequired,
      deadlines: PropTypes.object.isRequired,
      experiences: PropTypes.object.isRequired,
      statuses: PropTypes.object.isRequired,
    })
  }

  static defaultProps = {
    filters: {
      projects: {},
      labels: {},
      milestones: {},
      deadlines: {},
      experiences: {},
      statuses: {}
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      filters: [ 1, 2, 3, 4, 5 ]
    }
  }

  calculateFilters = () => {

  }

  render() {
    return (
      <div style={{
        marginLeft: '8px',
        flexDirection: 'row',
        display: 'flex',
        flex: '1'
      }}>
        {this.state.filters.map(filter => {
          return (
            <FilterTile />
          )
        })}
      </div>
    )
  }
}
