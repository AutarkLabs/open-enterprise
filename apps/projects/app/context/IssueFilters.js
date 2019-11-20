import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { prepareFilters } from '../components/Shared/FilterBar'

const IssueFiltersContext = createContext()

export const sortOptions = [
  'Newest',
  'Oldest',
  'Name ascending',
  'Name descending',
]

const initFilters = () => ({
  projects: {},
  labels: {},
  milestones: {},
  deadlines: {},
  experiences: {},
  statuses: {},
})

export function useIssueFilters() {
  const context = useContext(IssueFiltersContext)

  if (!context) {
    throw new Error('useIssueFilters must be used within a IssueFiltersProvider')
  }

  const {
    activeFilters,
    setActiveFilters,
    availableFilters,
    setAvailableFilters,
    textFilter,
    setTextFilter,
    sortBy,
    setSortBy,activeFiltersCount, setActiveFiltersCount
  } = context

  const resetFilters = useCallback(() => {
    setActiveFiltersCount(0)
    setActiveFilters(initFilters())
  }, [activeFilters])

  const buildAvailableFilters = useCallback((issues, bountyIssues) => {
    setAvailableFilters(
      prepareFilters(issues, bountyIssues)
    )
  })

  const toggleFilter = useCallback((type, id) => {
    const filters = { ...activeFilters }
    if (id in filters[type]) {
      delete filters[type][id]
      setActiveFiltersCount(activeFiltersCount - 1)
    } else {
      filters[type][id] = true
      setActiveFiltersCount(activeFiltersCount + 1)
    }
    setActiveFilters(filters)
  }, [activeFilters])

  const updateTextFilter = e => setTextFilter(e.target.value)

  const hookHelpers = useMemo(() => ({
    availableFilters,
    setAvailableFilters,
    activeFilters,
    setActiveFilters,
    activeFiltersCount,
    setActiveFiltersCount,
    buildAvailableFilters,
    toggleFilter,
    resetFilters,
    textFilter,
    updateTextFilter,
    sortBy,
    setSortBy,
  }), [ availableFilters, activeFilters, activeFiltersCount, sortBy, textFilter ])

  return hookHelpers
}

export function IssueFiltersProvider(props) {
  const [ availableFilters, setAvailableFilters ] = useState(initFilters())
  const [ activeFilters, setActiveFilters ] = useState(initFilters())
  const [ textFilter, setTextFilter ] = useState('')
  const [ sortBy, setSortBy ] = useState(sortOptions[0])
  const [ activeFiltersCount, setActiveFiltersCount ] = useState(0)

  const context = useMemo(() => ({
    availableFilters,
    setAvailableFilters,
    activeFilters,
    setActiveFilters,
    textFilter,
    setTextFilter,
    sortBy,
    setSortBy,activeFiltersCount, setActiveFiltersCount
  }), [ availableFilters, activeFilters, activeFiltersCount, textFilter, sortBy ])

  return <IssueFiltersContext.Provider value={context} {...props} />
}
