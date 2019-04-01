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

  filters.statuses['not-funded'] = {
    name: BOUNTY_STATUS['not-funded'],
    count: issues.length - bountyIssues.length,
  }
  bountyIssues.map(issue => {
    if (issue.data.workStatus in filters.statuses) {
      filters.statuses[issue.data.workStatus].count++
    } else {
      filters.statuses[issue.data.workStatus] = {
        name: BOUNTY_STATUS[issue.data.workStatus],
        count: 1,
      }
    }
  })

  issues.map(issue => {
    if (issue.milestone) {
      if (issue.milestone.id in filters.milestones) {
        filters.milestones[issue.milestone.id].count++
      } else {
        filters.milestones[issue.milestone.id] = {
          ...issue.milestone,
          count: 1,
        }
      }
    } else {
      if ('milestoneless' in filters.milestones) {
        filters.milestones['milestoneless'].count++
      } else {
        filters.milestones['milestoneless'] = {
          title: 'Issues without milestones',
          id: 'milestoneless',
          count: 1,
        }
      }
    }

    if (issue.labels.totalCount) {
      issue.labels.edges.map(label => {
        if (label.node.id in filters.labels) {
          filters.labels[label.node.id].count++
        } else {
          filters.labels[label.node.id] = { ...label.node, count: 1 }
        }
      })
    } else {
      if ('labelless' in filters.labels) {
        filters.labels['labelless'].count++
      } else {
        filters.labels['labelless'] = {
          name: 'Issues without labels',
          id: 'labelless',
          count: 1,
        }
      }
    }
    // TODO: shouldn't it be reporitory.id?
    if (issue.repository.id in filters.projects) {
      filters.projects[issue.repository.id].count++
    } else {
      filters.projects[issue.repository.id] = {
        name: issue.repository.name,
        count: 1,
      }
    }
  })
  return filters
}

export default prepareFilters
