export const applyFilters = ({ issues, textFilter, activeFilters, bountyIssues }) => {
  const bountyIssueObj = {}
  bountyIssues.forEach(issue => {
    bountyIssueObj[issue.issueNumber] = issue.data.workStatus
  })

  const issuesByProject = issues.filter(issue => {
    if (Object.keys(activeFilters.projects).length === 0) return true
    if (Object.keys(activeFilters.projects).indexOf(issue.repository.id) !== -1)
      return true
    return false
  })

  const issuesByLabel = issuesByProject.filter(issue => {
    // if there are no labels to filter by, pass all
    if (Object.keys(activeFilters.labels).length === 0) return true
    // if labelless issues are allowed, let them pass
    if ('labelless' in activeFilters.labels && issue.labels.totalCount === 0)
      return true
    // otherwise, fail all issues without labels
    if (issue.labels.totalCount === 0) return false

    const labelsIds = issue.labels.edges.map(label => label.node.id)

    if (
      Object.keys(activeFilters.labels).filter(id => labelsIds.indexOf(id) !== -1)
        .length > 0
    )
      return true
    return false
  })

  const issuesByMilestone = issuesByLabel.filter(issue => {
    // if there are no MS activeFilters, all issues pass
    if (Object.keys(activeFilters.milestones).length === 0) return true
    // should issues without milestones pass?
    if ('milestoneless' in activeFilters.milestones && issue.milestone === null)
      return true
    // if issues without milestones should not pass, they are rejected below
    if (issue.milestone === null) return false
    if (Object.keys(activeFilters.milestones).indexOf(issue.milestone.id) !== -1)
      return true
    return false
  })

  const issuesByStatus = issuesByMilestone.filter(issue => {
    // if there are no Status activeFilters, all issues pass
    if (Object.keys(activeFilters.statuses).length === 0) return true
    // should bountyless issues pass?
    const status = bountyIssueObj[issue.number]
      ? bountyIssueObj[issue.number]
      : 'not-funded'
    // if we look for all funded issues, regardless of stage...
    let filterPass =
      status in activeFilters.statuses ||
      ('all-funded' in activeFilters.statuses && status !== 'not-funded')
        ? true
        : false
    // ...or at specific stages
    return filterPass
  })

  // last but not least, if there is any text in textFilter...
  if (textFilter) {
    return issuesByStatus.filter(
      issue =>
        issue.title.toUpperCase().indexOf(textFilter) !== -1 ||
        String(issue.number).indexOf(textFilter) !== -1
    )
  }

  return issuesByStatus
}

