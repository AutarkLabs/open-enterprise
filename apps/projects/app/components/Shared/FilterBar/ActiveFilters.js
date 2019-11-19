import React from 'react'
import styled from 'styled-components'
import { Button, Text, useTheme } from '@aragon/ui'

import FilterTile from './FilterTile'
import { useIssueFilters } from '../../../context/IssueFilters'

const ActiveFilters = () => {
  const theme = useTheme()
  const { activeFilters, activeFiltersCount, availableFilters, resetFilters, toggleFilter } = useIssueFilters()

  return (
    <Wrap>
      {Object.keys(activeFilters).map(type =>
        Object.keys(activeFilters[type]).map(id =>
          <FilterTile
            key={id}
            text={availableFilters[type][id].name}
            disableFilter={() => toggleFilter(type, id)}
          />
        )
      )}
      {activeFiltersCount > 0 && (
        <Button
          size="mini"
          onClick={resetFilters}
          css={`
            margin-left: 8px;
            border: 0;
            box-shadow: unset;
            padding: 4px;
          `}
        >
          <Text size="small" color={`${theme.link}`}>
            Clear Filters
          </Text>
        </Button>
      )}
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
`

export default ActiveFilters