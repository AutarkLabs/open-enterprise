import React, { createContext, useContext, useEffect, useState } from 'react'
import { prepareFilters } from '../components/Shared/FilterBar'

const IssueFiltersContext = createContext()

const INIT_FILTERS = {
  projects: {},
  labels: {},
  milestones: {},
  deadlines: {},
  experiences: {},
  statuses: {},
}

export function useIssueFilters() {
  const context = useContext(IssueFiltersContext)

  if (!context) {
    throw new Error('useIssueFilters must be used within a IssueFiltersProvider')
  }

  const { activeFilters, setActiveFilters, availableFilters, setAvailableFilters, activeFiltersCount, setActiveFiltersCount } = context

  const resetFilters = () => {
    const filters = { ...activeFilters }

    // setActiveFilters(INIT_FILTERS) is not working - why?
    Object.keys(activeFilters).forEach(type =>
      Object.keys(activeFilters[type]).forEach(id =>
        delete filters[type][id]
      )
    )

    setActiveFiltersCount(0)
    setActiveFilters(filters)
  }

  const buildAvailableFilters = (issues, bountyIssues) => {
    useEffect(() => {
      const data = prepareFilters(issues, bountyIssues)
      setAvailableFilters(data)
    }, [ issues, bountyIssues ])
  }


  const toggleFilter = (type, id) => {
    const filters = { ...activeFilters }
    if (id in filters[type]) {
      delete filters[type][id]
      setActiveFiltersCount(activeFiltersCount - 1)
    } else {
      filters[type][id] = true
      setActiveFiltersCount(activeFiltersCount + 1)
    }
    setActiveFilters(filters)
  }

  return {
    buildAvailableFilters,
    availableFilters,
    setAvailableFilters,
    activeFilters,
    toggleFilter,
    activeFiltersCount,
    resetFilters,
  }
}

export function IssueFiltersProvider(props) {
  const [ availableFilters, setAvailableFilters ] = useState(INIT_FILTERS)
  const [ activeFilters, setActiveFilters ] = useState(INIT_FILTERS)
  const [ activeFiltersCount, setActiveFiltersCount ] = useState(0)

  return <IssueFiltersContext.Provider value={{
    availableFilters,
    setAvailableFilters,
    activeFilters,
    setActiveFilters,
    activeFiltersCount,
    setActiveFiltersCount,
  }} {...props} />
}
