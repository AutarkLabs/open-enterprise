import React from 'react'
import styled from 'styled-components'
import {
  Checkbox,
  Tag,
  useTheme,
} from '@aragon/ui'
import { BOUNTY_STATUS_FUNDED, BOUNTY_STATUS_GENERAL } from '../../../utils/bounty-status'
import { useIssueFilters } from '../../../context/IssueFilters'

const noop = () => {}

export const OptionsProjects = () => {
  const { availableFilters, activeFilters, toggleFilter } = useIssueFilters()
  const onClick = (id) => () => toggleFilter('projects', id)
  const projects = availableFilters.projects

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

export const OptionsLabels = () => {
  const theme = useTheme()
  const { availableFilters, activeFilters, toggleFilter } = useIssueFilters()
  const onClick = (id) => () => toggleFilter('labels', id)
  const labels = availableFilters.labels

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
          <div css="margin-left: 8px;">
            <Tag
              {...decoration}
              color={`${theme.surfaceContent}`}
              uppercase={false}
            >
              {labels[id].name}
            </Tag>{' '}
          ({labels[id].count})
          </div>
        </Option>
      )
    })
}

export const OptionsMilestones = () => {
  const { availableFilters, activeFilters, toggleFilter } = useIssueFilters()
  const onClick = (id) => () => toggleFilter('milestones', id)
  const milestones = availableFilters.milestones

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
          {milestones[id].name} (
          {milestones[id].count})
        </span>
      </Option>
    ))
}

export const OptionsStatuses = () => {
  const { availableFilters, activeFilters, toggleFilter } = useIssueFilters()
  const onClick = (id) => () => toggleFilter('statuses', id)
  const theme = useTheme()
  const statuses = availableFilters.statuses

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

const Option = styled.div`
  display: flex;
  align-items: center;
  padding: 5px;
  padding-right: 10px;
  cursor: pointer;
  white-space: nowrap;
`
