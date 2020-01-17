import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { formatDistance } from 'date-fns'
import { BN } from 'web3-utils'

import {
  DropDown,
  GU,
  Text,
  TextInput,
  useTheme,
} from '@aragon/ui'

import { FormField, FieldTitle } from '../../Form'
import useGithubAuth from '../../../hooks/useGithubAuth'
import { useAragonApi } from '../../../api-react'
import { usePanelManagement } from '../../Panel'
import { ipfsAdd } from '../../../utils/ipfs-helpers'
import { toHex } from 'web3-utils'
import { issueShape } from '../../../utils/shapes.js'
import {
  Avatar,
  FieldText,
  IssueTitle,
  PanelContent,
  ReviewButtons,
  Status,
  SubmissionDetails,
  TypeFilters,
  UserLink,
} from '../PanelComponents'
import workRatings from '../../../utils/work-ratings.js'
import { DetailHyperText } from '../../../../../../shared/ui'

const ReviewWork = ({ issue, submissionIndex, readOnly }) => {
  const githubCurrentUser = useGithubAuth()
  const {
    api: { reviewSubmission },
  } = useAragonApi()
  const { closePanel } = usePanelManagement()
  const theme = useTheme()

  const [ feedback, setFeedback ] = useState('')
  const [ rating, setRating ] = useState(-1)

  const submissionsApproved = issue.workSubmissions.reduce((counter, submission) => {
    if ('review' in submission && submission.review.accepted) counter++
    return counter
  }, 0)

  const canReview = submissionsApproved < (issue.bounties ? issue.bounties : 1) && !readOnly

  const typesToShow = []
  if (issue.workSubmissions.findIndex(submission => !('review' in submission)) !== -1)
    typesToShow.push(canReview ? 'Available for review' : 'Unreviewed')
  if (issue.workSubmissions.findIndex(submission => 'review' in submission) !== -1)
    typesToShow.push('Reviewed')

  let indexTypeSelected = 0
  if ('review' in issue.workSubmissions[submissionIndex])
    indexTypeSelected = (typesToShow[0] === 'Reviewed') ? 0 : 1

  const [ indexType, setIndexType ] = useState(indexTypeSelected)

  const workSubmissions = issue.workSubmissions.filter(r => {
    return (typesToShow[indexType] === 'Reviewed') ? 'review' in r : !('review' in r)
  })

  const newSubmissionIndex = workSubmissions.findIndex(
    submission => submission.submitter === issue.workSubmissions[submissionIndex].submitter
  )
  const [ index, setIndex ] = useState(newSubmissionIndex)

  const buildReturnData = accepted => {
    const today = new Date()
    return {
      feedback,
      rating,
      accepted,
      user: githubCurrentUser,
      reviewDate: today.toISOString(),
    }
  }

  const onAccept = () => onReviewSubmission(true)
  const onReject = () => onReviewSubmission(false)
  const updateRating = (index) => setRating(index)
  const updateFeedback = e => setFeedback(e.target.value)
  const changeSubmission = (index) => setIndex(index)
  const changeRequestType = (index) => {
    setIndex(0)
    setIndexType(index)
  }

  const canSubmit = () => !(rating > 0)

  const onReviewSubmission = async accepted => {
    const data = buildReturnData(accepted)

    // new IPFS data is old data plus state returned from the panel
    const ipfsData = issue.workSubmissions[issue.workSubmissions.length - 1]
    const requestIPFSHash = await ipfsAdd({ ...ipfsData, review: data })

    const total = new BN(issue.data.balance, 10)
    const fulfillers = issue.data.work.fulfillers
    const fulfillmentAmounts = fulfillers.map(() =>
      total.div(new BN(fulfillers.length, 10)).toString()
    )

    closePanel()

    reviewSubmission(
      toHex(issue.repoId),
      issue.number,
      issue.workSubmissions.length - 1,
      accepted,
      requestIPFSHash,
      fulfillmentAmounts
    ).toPromise()
  }

  const work = workSubmissions[index]
  const submitter = issue.work.user
  const submissionDateDistance = formatDistance(new Date(work.submissionDate), new Date())
  const submitterName = submitter.name ? submitter.name : submitter.login

  return(
    <PanelContent>
      <IssueTitle issue={issue} />

      <TypeFilters>
        <DropDown
          name="Type"
          items={typesToShow}
          onChange={changeRequestType}
          selected={indexType}
          wide
          css={`margin-right: ${0.5 * GU}px`}
        />

        <DropDown
          name="Submission"
          items={workSubmissions.map(submission => submission.user.login)}
          onChange={changeSubmission}
          selected={index}
          wide
          css={`margin-left: ${0.5 * GU}px`}
        />
      </TypeFilters>

      <SubmissionDetails background={`${theme.background}`} border={`${theme.border}`}>
        <UserLink>
          <Avatar user={submitter} />
          {submitterName} submitted work {submissionDateDistance} ago
        </UserLink>

        <FieldTitle>Submission</FieldTitle>
        <DetailHyperText>{work.proof}</DetailHyperText>

        {work.comments && (
          <>
            <FieldTitle>Additional Comments</FieldTitle>
            <DetailHyperText>{work.comments}</DetailHyperText>
          </>
        )}

        <FieldTitle>Hours Worked</FieldTitle>
        <Text>{work.hours}</Text>
      </SubmissionDetails>

      {('review' in work) && (
        <React.Fragment>
          <FieldTitle>Submission Status</FieldTitle>
          <FieldText>
            <Status reviewDate={work.review.reviewDate} approved={work.review.accepted} />
          </FieldText>

          <FieldTitle>Feedback</FieldTitle>
          <FieldText>
            <Text.Block>
              {work.review.feedback.length ? work.review.feedback : 'No feedback was provided'}
            </Text.Block>
          </FieldText>

          <FieldTitle>Quality Rating</FieldTitle>
          <FieldText>
            <Text.Block>
              {workRatings[work.review.rating]}
            </Text.Block>
          </FieldText>
        </React.Fragment>
      )}
      {canReview && !work.review && (
        <React.Fragment>
          <FormField
            label="Quality Rating"
            required
            input={
              <DropDown
                placeholder="Select rating"
                items={workRatings}
                onChange={updateRating}
                selected={rating}
                wide
              />
            }
          />

          <FormField
            label="Feedback"
            input={
              <TextInput.Multiline
                name="feedback"
                rows="3"
                onChange={updateFeedback}
                value={feedback}
                placeholder="Do you have any feedback to provide the contributor?"
                wide
                aria-label="Feedback"
              />
            }
          />

          <ReviewButtons onAccept={onAccept} onReject={onReject} disabled={canSubmit()} />

        </React.Fragment>
      )}

    </PanelContent>
  )
}
ReviewWork.propTypes = {
  issue: issueShape,
  readOnly: PropTypes.bool.isRequired,
  submissionIndex: PropTypes.number.isRequired,
}

export default ReviewWork
