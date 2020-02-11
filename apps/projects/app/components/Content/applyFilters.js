import { useIssueFilters } from '../../context/IssueFilters'

export const applyFilters = (issues = [], bountyIssues = []) => {
  const { activeFilters } = useIssueFilters()

  const bountyIssueObj = {}
  bountyIssues.forEach(issue => {
    bountyIssueObj[issue.issueNumber] = issue.data.workStatus
  })

  const issuesByStatus = issues.filter(issue => {
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

  return issuesByStatus
}

