import React, { Component } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, theme } from '@aragon/ui'

import FilterTile from './FilterTile'
import { prepareFilters } from '../Shared/FilterBar'

export default class Filters extends Component {
  static propTypes = {
    filters: PropTypes.shape({
      projects: PropTypes.object.isRequired,
      labels: PropTypes.object.isRequired,
      milestones: PropTypes.object.isRequired,
      deadlines: PropTypes.object.isRequired,
      experiences: PropTypes.object.isRequired,
      statuses: PropTypes.object.isRequired,
    }),
    issues: PropTypes.array,
    bountyIssues: PropTypes.array,
    disableFilter: PropTypes.func.isRequired,
    disableAllFilters: PropTypes.func.isRequired,
    style: PropTypes.object,
  }

  static defaultProps = {
    filters: {
      projects: {},
      labels: {},
      milestones: {},
      deadlines: {},
      experiences: {},
      statuses: {},
    },
    issues: [],
    bountyIssues: [],
  }

  generateFilterNamesAndPaths = (filterInformation, type, textFieldToUse) => {
    const { filters } = this.props
    const appliedFilters = {}
    Object.keys(filterInformation[type]).map(id => {
      const filterApplied = id in filters[type]
      const filterName = filterInformation[type][id][textFieldToUse]
      if (filterApplied) {
        appliedFilters[filterName] = [ type, id ]
      }
    })
    return appliedFilters
  }

  /*
    creates one object that looks like this:
    {
      filter1Name: [path, to, filter1, on, parent],
      filter2Name: [path, to, filter2, on, parent],
    }

    to make it easier to deselect filters from this view without multiple state objects
  */
  calculateFilters = () => {
    const { issues, bountyIssues } = this.props
    const filterInformation = prepareFilters(issues, bountyIssues)

    const projectBasedFilters = this.generateFilterNamesAndPaths(
      filterInformation,
      'projects',
      'name'
    )
    const labelBasedFilters = this.generateFilterNamesAndPaths(
      filterInformation,
      'labels',
      'name'
    )
    const milestoneBasedFilters = this.generateFilterNamesAndPaths(
      filterInformation,
      'milestones',
      'title'
    )
    const statusBasedFilters = this.generateFilterNamesAndPaths(
      filterInformation,
      'statuses',
      'name'
    )

    return {
      ...projectBasedFilters,
      ...labelBasedFilters,
      ...milestoneBasedFilters,
      ...statusBasedFilters,
    }
  }

  render() {
    const filterAliases = this.calculateFilters()
    const { style } = this.props

    if (Object.keys(filterAliases).length === 0) return null

    return (
      <Wrap style={style}>
        <div>
          {Object.keys(filterAliases).map(alias => {
            const pathToDisableFilter = filterAliases[alias]
            return (
              <FilterTile
                key={pathToDisableFilter.join('')}
                text={alias}
                disableFilter={() =>
                  this.props.disableFilter(pathToDisableFilter)
                }
              />
            )
          })}
        </div>
        {Object.keys(filterAliases).length > 0 && (
          <Button
            mode="text"
            size="small"
            onClick={this.props.disableAllFilters}
            style={{
              color: theme.accent,
              marginLeft: '18px',
            }}
          >
            Clear Filters
          </Button>
        )}
      </Wrap>
    )
  }
}

const Wrap = styled.div`
  display: flex;
`
