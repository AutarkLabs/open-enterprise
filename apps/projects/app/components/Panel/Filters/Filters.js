/*import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { formatDistance } from 'date-fns'
import {
  Button,
  DropDown,
  GU,
  useTheme,
} from '@aragon/ui'
import { usePanelManagement } from '../../Panel'



const DropDownContent = ({ filter, filters, labels }) => {
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
      <FilterMenuItem
        key={id}
        onClick={filter('labels', id)}
      >
        <div>
          <Checkbox
            onChange={noop}
            checked={id in filters.labels}
          />
        </div>
        <ActionLabel>
          <Tag
            {...decoration}
            color={`${theme.surfaceContent}`}
            uppercase={false}
          >
            {labels[id].name}
          </Tag>{' '}
        ({labels[id].count})
        </ActionLabel>
      </FilterMenuItem>
    )}
  )
    }

const Filters = ({ onChange, filters, filtersData }) => {
console.log('++++', onChange, filters, filtersData)
  const { closePanel } = usePanelManagement()
  const theme = useTheme()

  return (
    <div css={`margin: ${2 * GU}px 0`}>
    Filters
    <DropDown
      caption="Labels"
      enabled={Object.keys(filtersData.labels).length > 0}
    >
      <DropDownContent filter={onChange} filters={filters} filtersData={filtersData} />
    </DropDown>

    <Button onClick={() => onChange('hello from panel')} label="done">done</Button>
    </div>
  )
}
Filters.propTypes = {
  onChange: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  filtersData: PropTypes.object.isRequired,
}

const FilterMenuItem = styled.a`
  display: flex;
  align-items: center;
  padding: 5px;
  padding-right: 10px;
  white-space: nowrap;
  cursor: pointer;
`
const ActionLabel = styled.span`
  margin-left: 8px;
`


export default Filters





*/