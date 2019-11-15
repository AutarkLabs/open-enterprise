import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Checkbox,
  Tag,
  useTheme,
} from '@aragon/ui'
import { BOUNTY_STATUS_FUNDED, BOUNTY_STATUS_GENERAL } from '../../../utils/bounty-status'
import { useIssuesFilters } from '../../../context/IssuesFilters.js'

const noop = () => {}

export const OptionsProjects = ({ projects }) => {
  const { activeFilters, toggleFilter } = useIssuesFilters()
  const onClick = (id) => () => toggleFilter('projects', id)

  return Object.keys(projects)
    .sort(
      (p1, p2) =>
        projects[p1].name < projects[p2].name
          ? -1
          : 1
    )
    .map(id => (
      <Option
        key={id}
        onClick={onClick(id)}
      >
        <div>
          <Checkbox
            onChange={noop}
            checked={id in activeFilters.projects}
          />
        </div>
        <span css="margin-left: 8px;">
          {projects[id].name} (
          {projects[id].count})
        </span>
      </Option>
    ))
}

OptionsProjects.propTypes = PropTypes.object.isRequired

export const OptionsLabels = ({ labels }) => {
  const theme = useTheme()
  const { activeFilters, toggleFilter } = useIssuesFilters()
  const onClick = (id) => () => toggleFilter('labels', id)

  return Object.keys(labels)
    .sort((l1, l2) => {
      if (l1 === 'labelless') return -1
      if (l2 === 'labelless') return 1
      return labels[l1].name < labels[l2].name
        ? -1
        : 1
    })
    .map(id => {
      const decoration = labels[id].color ?
        { background: '#' + labels[id].color + '99' }
        :
        {
          style: { border: `1px solid ${theme.border}` },
          background: `#${theme.white}`
        }
      return (
        <Option
          key={id}
          onClick={onClick(id)}
        >
          <div>
            <Checkbox
              onChange={noop}
              checked={id in activeFilters.labels}
            />
          </div>
          <span css="margin-left: 8px;">
            <Tag
              {...decoration}
              color={`${theme.surfaceContent}`}
              uppercase={false}
            >
              {labels[id].name}
            </Tag>{' '}
          ({labels[id].count})
          </span>
        </Option>
      )
    })
}
OptionsLabels.propTypes = PropTypes.object.isRequired

export const OptionsMilestones = ({ milestones }) => {
  const { activeFilters, toggleFilter } = useIssuesFilters()
  const onClick = (id) => () => toggleFilter('milestones', id)

  return Object.keys(milestones)
    .sort((m1, m2) => {
      if (m1 === 'milestoneless') return -1
      if (m2 === 'milestoneless') return 1
      return milestones[m1].title <
    milestones[m2].title
        ? -1
        : 1
    })
    .map(id => (
      <Option
        key={id}
        onClick={onClick(id)}
      >
        <div>
          <Checkbox
            onChange={noop}
            checked={id in activeFilters.milestones}
          />
        </div>
        <span css="margin-left: 8px;">
          {milestones[id].title} (
          {milestones[id].count})
        </span>
      </Option>
    ))
}
OptionsMilestones.propTypes = PropTypes.object.isRequired

export const OptionsStatuses = ({ statuses }) => {
  const { activeFilters, toggleFilter } = useIssuesFilters()
  const onClick = (id) => () => toggleFilter('statuses', id)
  const theme = useTheme()

  return [
    BOUNTY_STATUS_FUNDED.map(status => (
      <Option
        key={status}
        onClick={onClick(status)}
      >
        <div>
          <Checkbox
            onChange={noop}
            checked={status in activeFilters.statuses}
          />
        </div>
        <span css="margin-left: 8px;">
          {statuses[status].name} (
          {statuses[status].count})
        </span>
      </Option>
    )),
    <hr
      key="hr"
      css={`
        height: 1px;
        border: 0;
        width: 100%;
        background: ${theme.border};
      `}
    />,
    BOUNTY_STATUS_GENERAL.map(status => (
      <Option
        key={status}
        onClick={onClick(status)}
      >
        <div>
          <Checkbox
            onChange={noop}
            checked={status in activeFilters.statuses}
          />
        </div>
        <span css="margin-left: 8px;">
          {statuses[status].name} (
          {statuses[status].count})
        </span>
      </Option>
    ))
  ]
}
OptionsStatuses.propTypes = PropTypes.object.isRequired

const Option = styled.a`
  display: flex;
  align-items: center;
  padding: 5px;
  padding-right: 10px;
  pointer: cursor;
  white-space: nowrap;
`
