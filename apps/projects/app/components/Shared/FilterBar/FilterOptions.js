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
            </Tag>
          </div>
        </Option>
      )
    })
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
          {statuses[status].name}
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
          {statuses[status].name}
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
