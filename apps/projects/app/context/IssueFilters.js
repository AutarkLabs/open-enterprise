import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { prepareFilters } from '../components/Shared/FilterBar'
import { compareAsc, compareDesc } from 'date-fns'

const IssueFiltersContext = createContext()

export const sortOptions = {
  'updated-desc': {
    name: 'Recently updated',
    func: (a, b) => compareDesc(new Date(a.updatedAt), new Date(b.updatedAt))
  },
  'updated-asc': {
    name: 'Least recently updated',
    func: (a, b) => compareAsc(new Date(a.updatedAt), new Date(b.updatedAt))
  },
}

const initFilters = () => ({
  labels: {},
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
    setSortBy,
    activeFiltersCount,
    setActiveFiltersCount,
    selectedIssues,
    setSelectedIssues,
    filteredIssues,
    setFilteredIssues,
  } = context

  const resetFilters = useCallback(() => {
    setActiveFiltersCount(0)
    setActiveFilters(initFilters())
  }, [activeFilters])

  const buildAvailableFilters = useCallback((repo) => {
    setAvailableFilters(
      prepareFilters(repo)
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

  const deselectAllIssues = () => setSelectedIssues({})

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
    selectedIssues,
    setSelectedIssues,
    deselectAllIssues,
    filteredIssues,
    setFilteredIssues
  }), [ availableFilters, activeFilters, activeFiltersCount, sortBy, textFilter, selectedIssues, filteredIssues ])

  return hookHelpers
}

export function IssueFiltersProvider(props) {
  const [ availableFilters, setAvailableFilters ] = useState(initFilters())
  const [ activeFilters, setActiveFilters ] = useState(initFilters())
  const [ textFilter, setTextFilter ] = useState('')
  const [ sortBy, setSortBy ] = useState('updated-desc')
  const [ activeFiltersCount, setActiveFiltersCount ] = useState(0)
  const [ selectedIssues, setSelectedIssues ] = useState({})
  const [ filteredIssues, setFilteredIssues ] = useState({})

  const context = useMemo(() => ({
    availableFilters,
    setAvailableFilters,
    activeFilters,
    setActiveFilters,
    textFilter,
    setTextFilter,
    sortBy,
    setSortBy,
    activeFiltersCount,
    setActiveFiltersCount,
    selectedIssues,
    setSelectedIssues,
    filteredIssues,
    setFilteredIssues,
  }), [ availableFilters, activeFilters, activeFiltersCount, textFilter, sortBy, selectedIssues, filteredIssues ])

  return <IssueFiltersContext.Provider value={context} {...props} />
}
