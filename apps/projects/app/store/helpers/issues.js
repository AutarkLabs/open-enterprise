import { hexToAscii, toHex } from 'web3-utils'
import { app } from '../app'
import { ipfsGet } from '../../utils/ipfs-helpers'
import standardBounties from '../../abi/StandardBounties.json'

const assignmentRequestStatus = [ 'Unreviewed', 'Accepted', 'Rejected' ]

const PROJECTS_APP_ID = '0xd79eEe331828492c2ba4c11bf468fb64d52a46F9'
const LOCAL_SUPERUSER_ID = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'

const getBountyStructure = {
  approvers: [PROJECTS_APP_ID],
  balance: '1000000000000000000',
  contributions: [{
    amount: '1000000000000000000',
    contributor: PROJECTS_APP_ID,
    refunded: false,
  }],
  deadline: '1569868629565',
  fulfillments: [{
    fulfillers: [LOCAL_SUPERUSER_ID],
    submitter: LOCAL_SUPERUSER_ID,
  }],
  hasBounty: true,
  hasPaidOut: false,
  issuers: [PROJECTS_APP_ID],
  standardBountyId: '0',
  token: '0x0000000000000000000000000000000000000000',
  tokenVersion: '0',
  workStatus: 'funded',
}

export const loadIssueData = async ({ repoId, issueNumber }) => {
  return new Promise(resolve => {
    app.call('getIssue', repoId, issueNumber).subscribe(async ({ hasBounty, standardBountyId, balance, assignee }) => {
      const bountiesRegistry = await app.call('bountiesRegistry').toPromise()
      const bountyContract = app.external(bountiesRegistry, standardBounties.abi)
      const bountyData = await bountyContract.getBounty(standardBountyId).toPromise()
      const token = await bountyData.token
      resolve({
        assignee: '0x0000000000000000000000000000000000000000', // TODO
        balance,
        deadline: '2019-10-14T20:34:00.140Z', // TODO
        detailsOpen: 0, // TODO
        exp: 0, // TODO
        fundingHistory: [{ // TODO
          date: '2019-09-30T20:34:19.416Z',
          user: {
            id: 'MDQ6VXNlcjE5ODA4MDc2',
            login: 'PeterMPhillips',
            url: 'https://github.com/PeterMPhillips',
            avatarUrl: 'https://avatars3.githubusercontent.com/u/19808076?v=4',
            __typename: 'User',
          },
        }],
        hasBounty,
        hours: 1, // TODO
        key: 'MDU6SXNzdWU0OTk2NzI3Mzg=', // TODO
        number: Number(issueNumber),
        repo: 'open-enterprise', // TODO
        repoId: hexToAscii(repoId),
        size: 1, // TODO
        slots: 1, // TODO
        slotsIndex: 0, // TODO
        standardBountyId,
        token,
        workStatus: 'funded', // TODO
      })
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
export const determineWorkStatus = issue => {
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

export const updateIssueDetail = async data => {
  let returnData = { ...data }
  const repoId = toHex(data.repoId)
  const issueNumber = String(data.number)
  const requestsData = await loadRequestsData({ repoId, issueNumber })
  returnData.requestsData = requestsData
  let submissionData = await loadSubmissionData({ repoId, issueNumber })
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
  }

  const nextIssues = Array.from(issues)
  nextIssues[issueIndex] = {
    issueNumber,
    data: data
  }
  return nextIssues
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

export const syncIssues = (state, { issueNumber }, data) => {
  try {
    return updateIssueState(state, issueNumber, data)
  } catch (err) {
    console.error('updateIssueState failed to return:', err)
  }
}
