import { hexToAscii, toHex } from 'web3-utils'
import { app } from '../app'
import { ipfsGet } from '../../utils/ipfs-helpers'
import standardBounties from '../../abi/StandardBounties.json'

const assignmentRequestStatus = [ 'Unreviewed', 'Accepted', 'Rejected' ]

/**
 * Load issue data from Projects.sol & StandardBounties.sol
 * @param {string} repoId: the identifier of this repo known to Projects.sol
 * @param {string} issueNumber: the identifier of the issue known to Projects.sol
 * @param {string} ipfsHash: the IPFS hash to fetch data from
 * @returns {Promise} resolves with data about this issue from both contracts, and placeholders for data that will eventually be filled in from elsewhere
 * @example
 *
 *     loadIssueData({ repoId: '0xdeadbee5deadbeef', issueNumber: '1234' })
 *     // example data returned from Promise:
 *     // {
 *     //   assignee: "0x0000000000000000000000000000000000000000",
 *     //   balance: "1000000000000000000",
 *     //   deadline: "2019-10-14T20:34:00.140Z",
 *     //   detailsOpen: 0,
 *     //   exp: 0,
 *     //   fundingHistory: [{
 *     //     date: '2019-09-30T20:34:19.416Z',
 *     //     user: {
 *     //       id: 'MDQ6VXNlcjE5ODA4MDc2',
 *     //       login: 'PeterMPhillips',
 *     //       url: 'https://github.com/PeterMPhillips',
 *     //       avatarUrl: 'https://avatars3.githubusercontent.com/u/19808076?v=4',
 *     //       __typename: 'User',
 *     //     },
 *     //   }],
 *     //   hasBounty: true,
 *     //   hours: 1,
 *     //   key: 'MDU6SXNzdWU0OTk2NzI3Mzg=',
 *     //   number: 1234,
 *     //   repo: 'open-enterprise',
 *     //   repoId: "MDEwOlJlcG9zaXRvcnkxMjY4OTkxNDM=",
 *     //   size: 1,
 *     //   slots: 1,
 *     //   slotsIndex: 0,
 *     //   standardBountyId: "0",
 *     //   token: "0xbdf671b626882fE207Cc2509086EFB804365460B",
 *     //   workStatus: "funded",
 *     // }
 */
export const loadIssueData = async ({ repoId, issueNumber, ipfsHash }) => {
  const {
    detailsOpen,
    exp,
    fundingHistory,
    hours,
    key,
    repo,
    size,
    slots,
    slotsIndex,
  } = await ipfsGet(ipfsHash)

  const {
    hasBounty,
    standardBountyId,
    balance,
    assignee,
  } = await app.call('getIssue', repoId, issueNumber).toPromise()

  const bountiesRegistry = await app.call('bountiesRegistry').toPromise()
  const bountyContract = app.external(bountiesRegistry, standardBounties.abi)
  const {
    deadline,
    token,
    workStatus,
  } = await bountyContract.getBounty(standardBountyId).toPromise()
  // example data returned from getBounty:
  // {
  //   approvers: ['0xd79eEe331828492c2ba4c11bf468fb64d52a46F9'], // projects app id
  //   balance: '1000000000000000000',
  //   contributions: [{
  //     amount: '1000000000000000000',
  //     contributor: '0xd79eEe331828492c2ba4c11bf468fb64d52a46F9', // projects app id
  //     refunded: false,
  //   }],
  //   deadline: '1569868629565',
  //   fulfillments: [{
  //     fulfillers: ['0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'], // local superuser
  //     submitter: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7', // local superuser
  //   }],
  //   hasBounty: true,
  //   hasPaidOut: false,
  //   issuers: [PROJECTS_APP_ID],
  //   standardBountyId: '0',
  //   token: '0x0000000000000000000000000000000000000000',
  //   tokenVersion: '0',
  //   workStatus: 'funded',
  // }

  // keep keys explicit for data integrity & code readability
  return {
    // passed in
    number: Number(issueNumber),
    repoId: hexToAscii(repoId),

    // from Projects.sol
    assignee,
    balance,
    hasBounty,
    standardBountyId,

    // from StandardBounties.sol
    deadline: new Date(Number(deadline)).toISOString(),
    token,
    workStatus,

    // from IPFS
    detailsOpen,
    exp,
    fundingHistory,
    hours,
    key,
    repo,
    size,
    slots,
    slotsIndex,
  }
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
