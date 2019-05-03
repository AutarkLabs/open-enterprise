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
import SortDropDown from './SortDropDown'
import prepareFilters from './prepareFilters'
import { IconBigArrowDown, IconBigArrowUp } from '../../Shared'

class FilterBar extends React.Component {
  state = {
    // direction: -1: .oO; 1: Oo.; 0: disabled
    sortBy: [
      { what: 'Name', direction: -1 },
      { what: 'Creation Date', direction: 1 },
      //{ what: 'Label', direction: 0 },
      //{ what: 'Milestone', direction: 0 },
      //{ what: 'Status', direction: 0 },
    ],
  }

  // that's non-event for filters checkboxes to stop browser complaining about missing onChange handler
  // the point is to make the checkbox controlled by its FilterMenuItem parent
  noop = () => {}

  filter = (type, id) => () => {
    const { filters } = this.props
    if (id in filters[type]) delete filters[type][id]
    else filters[type][id] = true
    // filters are in local state because of checkboxes
    // and sent to the parent (Issues) for actual display change
    this.props.setParentFilters({ filters })
    this.props.handleFiltering(filters)
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

  filterByProject = (filters, filtersData) => (
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
  )

  filterByLabel = (filters, filtersData) => (
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
                background={'#' + filtersData.labels[id].color + '99'}
                foreground={theme.textPrimary}
              >
                {filtersData.labels[id].name}
              </Badge>{' '}
            ({filtersData.labels[id].count})
            </ActionLabel>
          </FilterMenuItem>
        ))}
    </FilterDropDown>
  )

  filterByMilestone = (filters, filtersData) => (
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
  )

  filterByStatus = (filters, filtersData, allFundedIssues, allIssues) => (
    <FilterDropDown
      caption="Status"
      enabled={Object.keys(filtersData.statuses).length > 0}
    >
      {allFundedIssues.map(status => (
        <FilterMenuItem
          key={status}
          onClick={this.filter('statuses', status)}
          style={{ display: 'flex', alignItems: 'flex-start' }}
        >
          <div>
            <Checkbox
              onChange={this.noop}
              checked={status in filters.statuses}
            />
          </div>
          <ActionLabel>
            {filtersData.statuses[status].name} (
            {filtersData.statuses[status].count})
          </ActionLabel>
        </FilterMenuItem>
      ))}
      <Separator />
      {allIssues.map(status => (
        <FilterMenuItem
          key={status}
          onClick={this.filter('statuses', status)}
          style={{ display: 'flex', alignItems: 'flex-start' }}
        >
          <div>
            <Checkbox
              onChange={this.noop}
              checked={status in filters.statuses}
            />
          </div>
          <ActionLabel>
            {filtersData.statuses[status].name} (
            {filtersData.statuses[status].count})
          </ActionLabel>
        </FilterMenuItem>
      ))}
    </FilterDropDown>
  )

  sortDropDown = () => (
    <SortDropDown caption={'Sort by ' + this.props.sortBy.what}>
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
    </SortDropDown>
  )

  calculateShownFilters = childrenLength => {
    const containerWidth = this.theRef.current
      ? this.theRef.current.clientWidth
      : 0

    const itemWidth = 150
    let shown = Math.floor((containerWidth) / itemWidth)
    if (shown < childrenLength) {
      if (containerWidth < shown * itemWidth + 62) shown--
    }
    return shown
  }

  theRef = React.createRef()

  render() {
    const { handleSelectAll, allSelected, issues, bountyIssues, filters, sortBy } = this.props
    // filters contain information about active filters (checked checkboxes)
    // filtersData is about displayed checkboxes
    const allFundedIssues = [ 'funded', 'review-applicants', 'in-progress', 'review-work', 'fulfilled' ]
    const allIssues = [ 'all-funded', 'not-funded' ]
    const filtersData = prepareFilters(issues, bountyIssues)

    return (
      <StyledFilterBar>

        <FilterButton>
          <Checkbox onChange={handleSelectAll} checked={allSelected} />
        </FilterButton>

        <Overflow theRef={this.theRef} showFilters={this.calculateShownFilters(4)}>
          {this.filterByProject(filters, filtersData)}
          {this.filterByLabel(filters, filtersData)}
          {this.filterByMilestone(filters, filtersData)}
          {this.filterByStatus(filters, filtersData, allFundedIssues, allIssues)}
        </Overflow>

        {this.sortDropDown()}

      </StyledFilterBar>
    )
  }
}

FilterBar.propTypes = {
  issues: PropTypes.arrayOf(PropTypes.object).isRequired,
  sortBy: PropTypes.object.isRequired,
  handleSelectAll: PropTypes.func.isRequired,
  handleFiltering: PropTypes.func.isRequired,
  handleSorting: PropTypes.func.isRequired,
}

const StyledFilterBar = styled.div`
  width: 100%;
  min-width: 346px;
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
const Separator = styled.hr`
  height: 1px;
  border: 0;
  width: 100%;
  background: ${theme.contentBorder};
`

export default FilterBar
