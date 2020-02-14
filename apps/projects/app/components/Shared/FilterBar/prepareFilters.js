import { BOUNTY_STATUS } from '../../../utils/bounty-status'

/*
  prepareFilters builds data structure for displaying filterbar dropdowns
  data comes from complete issues array, issuesFiltered is used for counters
*/
const prepareFilters = (issues, bountyIssues, repo) => {
  let filters = {
    projects: {},
    labels: {},
    deadlines: {},
    experiences: {},
    statuses: {},
  }

  Object.keys(BOUNTY_STATUS).forEach(status =>
    filters.statuses[status] = {
      name: BOUNTY_STATUS[status],
    }
  )
  filters.statuses['all-funded'] = {
    name: BOUNTY_STATUS['all-funded'],
  }
  filters.statuses['not-funded'] = {
    name: BOUNTY_STATUS['not-funded'],
  }

  filters.labels = repo.metadata.labels || {}

  return filters
}

export default prepareFilters
