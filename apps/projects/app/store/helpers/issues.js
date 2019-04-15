import { app } from '../app'
import { ipfsGet } from '../../utils/ipfs-helpers'

const workStatus = {
  BountyAdded: { step: 0, status: 'funded' },
  AssignmentRequested : { step: 1, status: 'review-applicants' },
  AssignmentApproved: { step: 2, status: 'in-progress' },
  WorkSubmitted: { step: 3, status: 'review-work' },
  SubmissionRejected: { step: 4, status: 'review-work' },
  SubmissionAccepted: { step: 4, status: 'fulfilled' }
}

const reverseWorkStatus = {
  'funded': { step: 0, event: 'BountyAdded' },
  'review-applicants': { step: 1, event: 'AssignmentRequested' },
  'in-progress': { step: 2, event: 'AssignmentApproved' },
  'review-work': { step: 3, event: 'WorkSubmitted' },
  'fulfilled': { step: 4, event: 'SubmissionAccepted' },
}

const assignmentRequestStatus = [ 'Unreviewed', 'Accepted', 'Rejected' ]

export const loadIssueData = ({ repoId, issueNumber }) => {
  return new Promise(resolve => {
    app.call('getIssue', repoId, issueNumber).subscribe(async ({ hasBounty, standardBountyId, balance, token, dataHash, assignee }) => {
      const bountyData = await ipfsGet(dataHash)
      resolve({ balance, hasBounty, token, standardBountyId, assignee, ...bountyData })
    })
  })
}

const existPendingApplications = issue => {
  if (!('requestsData' in issue) || issue.requestsData.length === 0) return false
  return issue.requestsData.filter(rd => !('review' in rd)).length > 0
}

const existWorkInProgress = issue => {
  if (!('requestsData' in issue) || issue.requestsData.length === 0) return false

  let exists = false

  // each accepted request can have work submitted already
  issue.requestsData.forEach(request => {
    if ('review' in request && request.review.approved) {
      if (!('workSubmissions' in issue) || issue.workSubmissions.length === 0) {
        exists = true
        return
      }

      if (issue.workSubmissions.filter(
        work => (work.user.login === request.user.login && !('review' in work))
      ).length > 0) {
        exists = true
      }
    }
  })

  return exists
}

const isWorkDone = issue => {
  if (!('workSubmissions' in issue) || issue.workSubmissions.length === 0) return false
  return issue.workSubmissions.filter(work => ('review' in work && work.review.accepted)).length > 0
}

const workReadyForReview = issue => {
  if (!('workSubmissions' in issue) || issue.workSubmissions.length === 0) return false
  return issue.workSubmissions.filter(work => !('review' in work)).length > 0
}

// protects against eth events coming back in the wrong order for bountiesrequest.
export const determineWorkStatus = (issue, event) => {
  if (isWorkDone(issue)) {
    issue.workStatus = 'fulfilled'
    return issue  
  }
  if (!(existWorkInProgress(issue)) && !(workReadyForReview(issue))) {
    issue.workStatus = existPendingApplications(issue) ? 'review-applicants' : 'funded'
  } else{
    issue.workStatus = workReadyForReview(issue) ? 'review-work': 'in-progress'
  }
  return issue
}

const getRequest = (repoId, issueNumber, applicantId) => {
  return new Promise(resolve => {
    app.call('getApplicant', repoId, issueNumber, applicantId).subscribe(async (response) => {
      const bountyData = await ipfsGet(response.application)
      resolve({
        contributorAddr: response.applicant,
        status: assignmentRequestStatus[parseInt(response.status)],
        requestIPFSHash: response.application,
        ...bountyData
      })
    })
  })
}

const loadRequestsData = ({ repoId, issueNumber }) => {
  return new Promise(resolve => {
    app.call('getApplicantsLength', repoId, issueNumber).subscribe(async (response) => {
      let applicants = []
      for(let applicantId = 0; applicantId < response; applicantId++){
        applicants.push(await getRequest(repoId, issueNumber, applicantId))
      }
      resolve(applicants)
    })
  })
}

const getSubmission = (repoId, issueNumber, submissionIndex) => {
  return new Promise(resolve => {
    app.call('getSubmission', repoId, issueNumber, submissionIndex)
      .subscribe(async ({ submissionHash, fulfillmentId, status, submitter }) => {
        const bountyData = await ipfsGet(submissionHash)
        resolve({ status,
          fulfillmentId,
          submitter,
          submissionIPFSHash: submissionHash,
          ...bountyData
        })
      })
  })
}

const loadSubmissionData = ({ repoId, issueNumber }) => {
  return new Promise(resolve => {
    app.call('getSubmissionsLength', repoId, issueNumber).subscribe(async (response) => {
      let submissions = []
      for(let submissionId = 0; submissionId < response; submissionId++){
        submissions.push(await getSubmission(repoId, issueNumber, submissionId))
      }
      resolve(submissions)
    })
  })
}

export const updateIssueDetail = async (data, response) => {
  let returnData = { ...data }
  const requestsData = await loadRequestsData(response.returnValues)
  returnData.requestsData = requestsData
  let submissionData = await loadSubmissionData(response.returnValues)
  returnData.workSubmissions = submissionData
  returnData.work = submissionData[submissionData.length - 1]
  return returnData
}

const checkIssuesLoaded = (issues, issueNumber, data) => {
  const issueIndex = issues.findIndex(issue => issue.issueNumber === issueNumber)

  if (issueIndex === -1) {
    // If we can't find it, load its data, perform the transformation, and concat
    return issues.concat({
      issueNumber,
      data: data
    })
  } else {
    const nextIssues = Array.from(issues)
    nextIssues[issueIndex] = {
      issueNumber,
      data: data
    }
    return nextIssues
  }
}

const updateIssueState = (state, issueNumber, data) => {
  if(!data) return state
  const issues = state.issues || []
  let newIssues
  try {
    newIssues = checkIssuesLoaded(issues, issueNumber, data)
    let newState = { ...state, issues: newIssues }
    return newState
  } catch (err) {
    console.error(
      'Update issues failed to return:',
      err,
      'here\'s what returned in newIssues',
      newIssues
    )
  }
}

export const syncIssues = (state, { issueNumber, ...eventArgs }, data) => {
  try {
    return updateIssueState(state, issueNumber, data)
  } catch (err) {
    console.error('updateIssueState failed to return:', err)
  }
}
