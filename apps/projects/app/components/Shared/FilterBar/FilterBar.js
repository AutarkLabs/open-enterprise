import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Badge, Button, theme, Text, ContextMenuItem as FilterMenuItem } from '@aragon/ui'

import Overflow from './Overflow'
import FilterButton from './FilterButton'
import { CheckButton, IconArrowDown } from '../'
import FilterDropDown from './FilterDropDown'
//import { DropDownButton } from '../../Shared'

const StyledFilterBar = styled.div`
  width: 100%;
  background: ${theme.contentBackground};
  display: flex;
  margin: 12px 0;
  height: 40px;
  align-items: center;
  border-radius: 3px;
  > :first-child {
    width: 48px;
    padding: 0;
    justify-content: center;
    border-radius: 3px 0 0 3px;
  }
  > :nth-last-child(2) {
    flex: 1 1 auto;
  }
  > :last-child {
    border-radius: 0 3px 3px 0;
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
    }
  }

  // that's non-event for filters checkboxes to stop browser complaining about missing onChange handler
  // the point is to make the checkbox controlled by its FilterMenuItem parent
  noop = () => {}

  filter = (type, id) => () => {
    const { filters } = this.state
    if (id in filters[type])
      delete(filters[type][id])
    else
      filters[type][id] = true
    // filters are in local state because of checkboxes
    // and sent to the parent (Issues) for actual display change
    this.setState({ filters })
    this.props.handleFiltering(filters)
  }

  /*
    prepareFilters builds data structure for displaying filterbar dropdowns
    data comes from complete issues array, issuesFiltered is used for counters
  */
  prepareFilters = (issues, issuesFiltered) => {
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
          filters.milestones[issue.milestone.id] = { ...issue.milestone, count: 1 }
        }
      } else {
        if ('milestoneless' in filters.milestones) {
          filters.milestones['milestoneless'].count++
        } else {
          filters.milestones['milestoneless'] = { title: 'Issues without milestones', id: 'milestoneless', count: 1 }
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
          filters.labels['labelless'] = { name: 'Issues without labels', id: 'labelless', count: 1 }
        }
      }
      // TODO: shouldn't it be reporitory.id?
      if (issue.repository.id in filters.projects) {
        filters.projects[issue.repository.id].count++
      } else {
        filters.projects[issue.repository.id] = { name: issue.repository.name, count: 1 }
      }
    })
    return filters
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
          <CheckButton onChange={handleSelectAll} checked={allSelected} />
        </FilterButton>
        
        <Overflow>
          <FilterDropDown caption="Projects" enabled={ Object.keys(filtersData.projects).length > 0}>
            { Object.keys(filtersData.projects).map(
              id => (
                <FilterMenuItem
                  key={id}
                  onClick={this.filter('projects', id)}
                  style={{ display: 'flex', alignItems: 'flex-start' }}
                >
                  <div>
                    <CheckButton onChange={this.noop} checked={id in filters.projects} />
                  </div>
                  <ActionLabel>
                    {filtersData.projects[id].name} ({filtersData.projects[id].count})
                  </ActionLabel>
                </FilterMenuItem>
              ))
            }
          </FilterDropDown>

          <FilterDropDown caption="Labels" enabled={ Object.keys(filtersData.labels).length > 0}>
            { Object.keys(filtersData.labels).map(
              id => (
                <FilterMenuItem
                  key={id}
                  onClick={this.filter('labels', id)}
                  style={{ display: 'flex', alignItems: 'flex-start' }}
                >
                  <div>
                    <CheckButton onChange={this.noop} checked={id in filters.labels} />
                  </div>
                  <ActionLabel>
                    <Badge background={'#'+filtersData.labels[id].color} foreground={'#000'}>{filtersData.labels[id].name}</Badge> ({filtersData.labels[id].count})
                  </ActionLabel>
                </FilterMenuItem>
              ))
            }
          </FilterDropDown>

          <FilterDropDown caption="Milestones" enabled={ Object.keys(filtersData.milestones).length > 0}>
            { Object.keys(filtersData.milestones).map(
              id => (
                <FilterMenuItem
                  key={id}
                  onClick={this.filter('milestones', id)}
                  style={{ display: 'flex', alignItems: 'flex-start' }}
                >
                  <div>
                    <CheckButton onChange={this.noop} checked={id in filters.milestones} />
                  </div>
                  <ActionLabel>
                    {filtersData.milestones[id].title} ({filtersData.milestones[id].count})
                  </ActionLabel>
                </FilterMenuItem>
              ))
            }
          </FilterDropDown>

          <FilterDropDown caption="Status" enabled={false}>
          </FilterDropDown>
          <FilterDropDown caption="Deadline" enabled={false}>
          </FilterDropDown>
          <FilterDropDown caption="Experience" enabled={false}>
          </FilterDropDown>

        </Overflow>

        <FilterDropDown caption="Sort by" enabled={true}>
          <FilterMenuItem key={'1'} onClick={this.noop} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div><CheckButton onChange={this.noop} checked={false} /></div>
            <ActionLabel> ...label </ActionLabel>
          </FilterMenuItem>
          <FilterMenuItem key={'2'} onClick={this.noop} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div><CheckButton onChange={this.noop} checked={false} /></div>
            <ActionLabel>...deadline</ActionLabel>
          </FilterMenuItem>
          <FilterMenuItem key={'3'} onClick={this.noop} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div><CheckButton onChange={this.noop} checked={false} /></div>
            <ActionLabel>status</ActionLabel>
          </FilterMenuItem>
        </FilterDropDown>
      </StyledFilterBar>
    )
  }
}

FilterBar.propTypes = {
  issues: PropTypes.arrayOf(PropTypes.object).isRequired,
  handleSelectAll: PropTypes.func.isRequired,
  handleFiltering: PropTypes.func.isRequired
}

export default FilterBar
