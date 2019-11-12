import React, { createContext, useContext, useEffect, useState } from 'react'
import { prepareFilters } from '../components/Shared/FilterBar'

const IssuesFiltersContext = createContext()

export function useIssuesFilters() {
  const context = useContext(IssuesFiltersContext)

  if (!context) {
    throw new Error('useIssuesFilters must be used within a IssuesFiltersProvider')
  }
 console.log('====', context)
  const [ filtersAllData, setFiltersAllData ] = useState({
    projects: {},
    labels: {},
    milestones: {},
    deadlines: {},
    experiences: {},
    statuses: {},
  })
  const { activeFilters, setActiveFilters } = context

  const [ activeFiltersCount, setActiveFiltersCount ] = useState(21)

  /*
  const activeFiltersCount = () => {
    let count = 0
    const types = [ 'projects', 'labels', 'milestones', 'statuses' ]
    types.forEach(t => count += Object.keys(filters[t]).length)
    return count
  }
*/

  const buildAllFiltersData = (issues, bountyIssues) => {
    useEffect(() => {
      const data = prepareFilters(issues, bountyIssues)
      console.log('-- called buildFiltersData --', data)
      setFiltersAllData(data)
    }, [issues, bountyIssues])
  }

  const toggleFilter = (type, id) => {
console.log('+++ toggleFilter called', type, id)
const filters = {...activeFilters}
      if (id in filters[type]) {
        delete filters[type][id]
        setActiveFiltersCount(activeFiltersCount - 1)
      } else {
        filters[type][id] = true
        setActiveFiltersCount(activeFiltersCount + 1)
      }
      // filters are in local state because of checkboxes
      // and sent to the parent (Issues) for actual display change
//      setParentFilters({ filters })
//      handleFiltering(filters)
console.log('+++ toggleFilter result:', filters)

      setActiveFilters(filters)
    }


  return {
    buildAllFiltersData,
    filtersAllData,
    activeFilters,
    toggleFilter,
    activeFiltersCount,
  }
}

export function IssuesFiltersProvider(props) {
  const [ activeFilters, setActiveFilters ] = useState({
    projects: {},
    labels: {},
    milestones: {},
    deadlines: {},
    experiences: {},
    statuses: {},
  })

  return <IssuesFiltersContext.Provider value={{
    activeFilters,
    setActiveFilters
  }} {...props} />
}
