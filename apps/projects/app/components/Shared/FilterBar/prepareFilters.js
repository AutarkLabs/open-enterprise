import { BOUNTY_STATUS } from '../../../utils/bounty-status'

/*
  prepareFilters builds data structure for displaying filterbar dropdowns
  data comes from complete issues array, issuesFiltered is used for counters
*/
const prepareFilters = (issues, bountyIssues) => {
  let filters = {
    projects: {},
    labels: {},
    milestones: {},
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

  issues.map(issue => {
    if (issue.milestone) {
      if (!(issue.milestone.id in filters.milestones)) {
        filters.milestones[issue.milestone.id] = issue.milestone
      }
    } else {
      if (!('milestoneless' in filters.milestones)) {
        filters.milestones['milestoneless'] = {
          title: 'Issues without milestones',
          id: 'milestoneless',
        }
      }
    }

    if (issue.labels.totalCount) {
      issue.labels.edges.map(label => {
        if (!(label.node.id in filters.labels)) {
          filters.labels[label.node.id] = label.node
        }
      })
    } else {
      if (!('labelless' in filters.labels)) {
        filters.labels['labelless'] = {
          name: 'Issues without labels',
          id: 'labelless',
        }
      }
    }
    // TODO: shouldn't it be reporitory.id?
    if (!(issue.repository.id in filters.projects)) {
      filters.projects[issue.repository.id] = {
        name: issue.repository.name,
      }
    }
  })
  return filters
}

export default prepareFilters
