import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Badge,
  Checkbox,
  ContextMenuItem as FilterMenuItem,
  theme,
} from '@aragon/ui'

import Overflow from './Overflow'
import FilterButton from './FilterButton'
import FilterDropDown from './FilterDropDown'
import { IconBigArrowDown, IconBigArrowUp } from '../../Shared'

const StyledFilterBar = styled.div`
  width: 100%;
  display: flex;
  margin: 12px 0;
  height: 40px;
  align-items: center;
  border-radius: 3px;
  > * {
    background: ${theme.contentBackground};
  }
  > :first-child {
    width: 48px;
    padding: 0;
    justify-content: center;
    border-radius: 3px 0 0 3px;
  }
  > :nth-last-child(2) {
    flex: 1 1 auto;
    z-index: 3;
  }
  > :last-child {
    > * {
      border-radius: 0 3px 3px 0;
    }
  }
`

const ActionLabel = styled.span`
  margin-left: 15px;
`

class FilterBar extends React.Component {
  state = {
    filters: {
      projects: {},
      labels: {},
      milestones: {},
      deadlines: {},
      experiences: {},
    },
    // direction: -1: .oO; 1: Oo.; 0: disabled
    sortBy: [
      { what: 'Name', direction: -1 },
      //{ what: 'Label', direction: 0 },
      //{ what: 'Milestone', direction: 0 },
      //{ what: 'Status', direction: 0 },
    ],
  }

  componentWillMount() {
    if ('filterIssuesByRepoId' in this.props.activeIndex.tabData) {
      let { filters } = this.state
      filters.projects[
        this.props.activeIndex.tabData.filterIssuesByRepoId
      ] = true
      this.setState({ filters })
    }
  }

  // that's non-event for filters checkboxes to stop browser complaining about missing onChange handler
  // the point is to make the checkbox controlled by its FilterMenuItem parent
  noop = () => {}

  filter = (type, id) => () => {
    const { filters } = this.state
    if (id in filters[type]) delete filters[type][id]
    else filters[type][id] = true
    // filters are in local state because of checkboxes
    // and sent to the parent (Issues) for actual display change
    this.setState({ filters })
    this.props.handleFiltering(filters)
  }

  /*
    prepareFilters builds data structure for displaying filterbar dropdowns
    data comes from complete issues array, issuesFiltered is used for counters
  */
  prepareFilters = (issues, _issuesFiltered) => {
    let filters = {
      projects: {},
      labels: {},
      milestones: {},
      deadlines: {},
      experiences: {},
    }
    issues.map(issue => {
      if (issue.milestone) {
        if (issue.milestone.id in filters.milestones) {
          filters.milestones[issue.milestone.id].count++
        } else {
          filters.milestones[issue.milestone.id] = {
            ...issue.milestone,
            count: 1,
          }
        }
      } else {
        if ('milestoneless' in filters.milestones) {
          filters.milestones['milestoneless'].count++
        } else {
          filters.milestones['milestoneless'] = {
            title: 'Issues without milestones',
            id: 'milestoneless',
            count: 1,
          }
        }
      }

      if (issue.labels.totalCount) {
        issue.labels.edges.map(label => {
          if (label.node.id in filters.labels) {
            filters.labels[label.node.id].count++
          } else {
            filters.labels[label.node.id] = { ...label.node, count: 1 }
          }
        })
      } else {
        if ('labelless' in filters.labels) {
          filters.labels['labelless'].count++
        } else {
          filters.labels['labelless'] = {
            name: 'Issues without labels',
            id: 'labelless',
            count: 1,
          }
        }
      }
      // TODO: shouldn't it be reporitory.id?
      if (issue.repository.id in filters.projects) {
        filters.projects[issue.repository.id].count++
      } else {
        filters.projects[issue.repository.id] = {
          name: issue.repository.name,
          count: 1,
        }
      }
    })
    return filters
  }

  generateSort = what => () => {
    const sortBy = this.state.sortBy
    sortBy.map(s => {
      if (s.what === what) {
        s.direction = s.direction === 0 ? -1 : s.direction * -1
        this.props.handleSorting(s)
      } else s.direction = 0
    })
    this.setState(sortBy)
  }

  render() {
    const { handleSelectAll, allSelected, issues } = this.props
    // filters contain information about active filters (checked checkboxes)
    const { filters } = this.state
    // filtersData is about displayed checkboxes
    const filtersData = this.prepareFilters(issues)

    return (
      <StyledFilterBar>
        <FilterButton>
          <Checkbox onChange={handleSelectAll} checked={allSelected} />
        </FilterButton>

        <Overflow>
          <FilterDropDown
            caption="Projects"
            enabled={Object.keys(filtersData.projects).length > 0}
          >
            {Object.keys(filtersData.projects)
              .sort(
                (p1, p2) =>
                  filtersData.projects[p1].name < filtersData.projects[p2].name
                    ? -1
                    : 1
              )
              .map(id => (
                <FilterMenuItem
                  key={id}
                  onClick={this.filter('projects', id)}
                  style={{ display: 'flex', alignItems: 'flex-start' }}
                >
                  <div>
                    <Checkbox
                      onChange={this.noop}
                      checked={id in filters.projects}
                    />
                  </div>
                  <ActionLabel>
                    {filtersData.projects[id].name} (
                    {filtersData.projects[id].count})
                  </ActionLabel>
                </FilterMenuItem>
              ))}
          </FilterDropDown>

          <FilterDropDown
            caption="Labels"
            enabled={Object.keys(filtersData.labels).length > 0}
          >
            {Object.keys(filtersData.labels)
              .sort((l1, l2) => {
                if (l1 === 'labelless') return -1
                if (l2 === 'labelless') return 1
                return filtersData.labels[l1].name < filtersData.labels[l2].name
                  ? -1
                  : 1
              })
              .map(id => (
                <FilterMenuItem
                  key={id}
                  onClick={this.filter('labels', id)}
                  style={{ display: 'flex', alignItems: 'flex-start' }}
                >
                  <div>
                    <Checkbox
                      onChange={this.noop}
                      checked={id in filters.labels}
                    />
                  </div>
                  <ActionLabel>
                    <Badge
                      background={'#' + filtersData.labels[id].color}
                      foreground={'#000'}
                    >
                      {filtersData.labels[id].name}
                    </Badge>{' '}
                    ({filtersData.labels[id].count})
                  </ActionLabel>
                </FilterMenuItem>
              ))}
          </FilterDropDown>

          <FilterDropDown
            caption="Milestones"
            enabled={Object.keys(filtersData.milestones).length > 0}
          >
            {Object.keys(filtersData.milestones)
              .sort((m1, m2) => {
                if (m1 === 'milestoneless') return -1
                if (m2 === 'milestoneless') return 1
                return filtersData.milestones[m1].title <
                  filtersData.milestones[m2].title
                  ? -1
                  : 1
              })
              .map(id => (
                <FilterMenuItem
                  key={id}
                  onClick={this.filter('milestones', id)}
                  style={{ display: 'flex', alignItems: 'flex-start' }}
                >
                  <div>
                    <Checkbox
                      onChange={this.noop}
                      checked={id in filters.milestones}
                    />
                  </div>
                  <ActionLabel>
                    {filtersData.milestones[id].title} (
                    {filtersData.milestones[id].count})
                  </ActionLabel>
                </FilterMenuItem>
              ))}
          </FilterDropDown>
          {/*
          <FilterDropDown caption="Status" enabled={false}>
          </FilterDropDown>
          <FilterDropDown caption="Deadline" enabled={false}>
          </FilterDropDown>
          <FilterDropDown caption="Experience" enabled={false}>
          </FilterDropDown>
           */}
        </Overflow>

        <FilterDropDown caption="Sort by" enabled={true}>
          {this.state.sortBy.map(s => (
            <FilterMenuItem
              key={s.what}
              onClick={this.generateSort(s.what)}
              style={{ display: 'flex', alignItems: 'flex-start' }}
            >
              <div style={{ width: '20px' }}>
                {s.direction === 1 && <IconBigArrowDown />}
                {s.direction === -1 && <IconBigArrowUp />}
              </div>
              <ActionLabel>{s.what}</ActionLabel>
            </FilterMenuItem>
          ))}
        </FilterDropDown>
      </StyledFilterBar>
    )
  }
}

FilterBar.propTypes = {
  issues: PropTypes.arrayOf(PropTypes.object).isRequired,
  handleSelectAll: PropTypes.func.isRequired,
  handleFiltering: PropTypes.func.isRequired,
  handleSorting: PropTypes.func.isRequired,
}

export default FilterBar
