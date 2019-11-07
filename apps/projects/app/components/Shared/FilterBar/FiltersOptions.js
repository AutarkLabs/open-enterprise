import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import {
  Checkbox,
  Tag,
  useTheme,
} from '@aragon/ui'

const noop = () => {}

export const OptionsProjects = ({ onClick, filters, projects }) => {
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
        onClick={onClick('projects', id)}
      >
        <div>
          <Checkbox
            onChange={noop}
            checked={id in filters.projects}
          />
        </div>
        <span css="margin-left: 8px;">
          {projects[id].name} (
          {projects[id].count})
        </span>
      </Option>
    ))
}

OptionsProjects.propTypes = {
  onClick: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  projects: PropTypes.object.isRequired,
}

export const OptionsLabels = ({ onClick, filters, labels }) => {
  const theme = useTheme()

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
          onClick={onClick('labels', id)}
        >
          <div>
            <Checkbox
              onChange={noop}
              checked={id in filters.labels}
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
OptionsLabels.propTypes = {
  onClick: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  labels: PropTypes.object.isRequired,
}

export const OptionsMilestones = ({ onClick, filters, milestones }) => {
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
        onClick={onClick('milestones', id)}
      >
        <div>
          <Checkbox
            onChange={noop}
            checked={id in filters.milestones}
          />
        </div>
        <span css="margin-left: 8px;">
          {milestones[id].title} (
          {milestones[id].count})
        </span>
      </Option>
    ))
}
OptionsMilestones.propTypes = {
  onClick: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  milestones: PropTypes.object.isRequired,
}

export const OptionsStatuses = ({ onClick, filters, statuses, allFundedIssues, allIssues }) => {
  const theme = useTheme()

  return [
    allFundedIssues.map(status => (
      <Option
        key={status}
        onClick={onClick('statuses', status)}
      >
        <div>
          <Checkbox
            onChange={noop}
            checked={status in filters.statuses}
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
    allIssues.map(status => (
      <Option
        key={status}
        onClick={onClick('statuses', status)}
      >
        <div>
          <Checkbox
            onChange={noop}
            checked={status in filters.statuses}
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
OptionsStatuses.propTypes = {
  onClick: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  statuses: PropTypes.object.isRequired,
  allFundedIssues: PropTypes.array.isRequired,
  allIssues: PropTypes.array.isRequired,
}

const Option = styled.a`
  display: flex;
  align-items: center;
  padding: 5px;
  padding-right: 10px;
  pointer: cursor;
  white-space: nowrap;
`
