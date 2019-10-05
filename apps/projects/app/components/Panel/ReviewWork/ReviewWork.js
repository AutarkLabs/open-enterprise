import React, { useState } from 'react'
import styled from 'styled-components'
import { formatDistance } from 'date-fns'
import { BN } from 'web3-utils'

import {
  Button,
  DropDown,
  GU,
  IconCheck,
  IconCross,
  Link,
  Text,
  Tag,
  useTheme,
} from '@aragon/ui'

import { FormField, FieldTitle, DescriptionInput } from '../../Form'
import { IconGitHub } from '../../Shared'
import useGithubAuth from '../../../hooks/useGithubAuth'
import { useAragonApi } from '../../../api-react'
import { usePanelManagement } from '../../Panel'
import { ipfsAdd } from '../../../utils/ipfs-helpers'
import { toHex } from 'web3-utils'
import { issueShape } from '../../../utils/shapes.js'

const ReviewWork = ({ issue }) => {
  const githubCurrentUser = useGithubAuth()
  const {
    api: { reviewSubmission },
  } = useAragonApi()
  const { closePanel } = usePanelManagement()
  const theme = useTheme()

  const [ feedback, setFeedback ] = useState('')
  const [ rating, setRating ] = useState(-1)

  const buildReturnData = (accepted) => {
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

  const canSubmit = () => !(rating > 0)

  const onReviewSubmission = async (accepted) => {
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

  const work = issue.work
  const submitter = issue.work.user
  const submissionDateDistance = formatDistance(new Date(work.submissionDate), new Date())
  const submitterName = submitter.name ? submitter.name : submitter.login
  const ratings = [
    'Select a Rating',
    '1 - Unusable',
    '2 - Needs Rework',
    '3 - Acceptable',
    '4 - Exceeds Expectations',
    '5 - Excellent',
  ]

  const { title, repo, number, url } = issue

  return(
    <div css={`margin: ${2 * GU}px 0`}>
      <Text.Block size="xlarge">{title}</Text.Block>

      <Link
        href={url}
        target="_blank"
        style={{ textDecoration: 'none', color: `${theme.link}` }}
      >
        <IssueLinkRow>
          <IconGitHub color={`${theme.link}`} width='14px' height='14px' />
          <Text css="margin-left: 6px">
            {repo} #{number}
          </Text>
        </IssueLinkRow>
      </Link>

      <SubmissionDetails background={`${theme.background}`} border={`${theme.border}`}>
        <UserLink>
          <img
            alt=""
            src={submitter.avatarUrl}
            css="width: 32px; height: 32px; margin-right: 10px"
          />
          <Link
            href={submitter.url}
            target="_blank"
            style={{ textDecoration: 'none', color: `${theme.link}`, marginRight: '6px' }}
          >
            {submitterName}
          </Link>
            applied {submissionDateDistance} ago
        </UserLink>

        <Separator/>

        <FieldTitle>Proof of Work</FieldTitle>
        <DetailText>{work.proof}</DetailText>

        {work.comments && <FieldTitle>Additional Comments</FieldTitle>}
        {work.comments && <DetailText>{work.comments}</DetailText>}

        <FieldTitle>Hours Worked</FieldTitle>
        <DetailText>{work.hours}</DetailText>
      </SubmissionDetails>

      {('review' in work) ? (
        <React.Fragment>

          <FieldTitle>Submission Status</FieldTitle>

          <div css="margin: 10px 0">
            {work.review.accepted ? (
              <div css="display: flex; align-items: center">
                <IconCheck color={`${theme.positive}`} css="margin-top: -4px; margin-right: 8px"/>
                <Text color={`${theme.positive}`}>Accepted</Text>
              </div>
            ) : (
              <div css="display: flex; align-items: center">
                <IconCross color={`${theme.negative}`} css="margin-top: -4px; margin-right: 8px" />
                <Text color={`${theme.negative}`}>Rejected</Text>
              </div>
            )}
          </div>

          <FieldTitle>Feedback</FieldTitle>
          <Text.Block style={{ margin: '10px 0' }}>
            {work.review.feedback.length ? work.review.feedback : 'No feedback was provided'}
          </Text.Block>

          <Tag
            uppercase={false}
            foreground={`${theme.surfaceContentSecondary}`}
            background={`${theme.border}`}
          >
            {'Quality:' + ' ' + ratings[work.review.rating]}
          </Tag>

        </React.Fragment>
      ) : (
        <React.Fragment>

          <FormField
            label="Quality Rating"
            required
            input={
              <DropDown
                placeholder="Select rating"
                items={ratings}
                onChange={updateRating}
                selected={rating}
                wide
              />
            }
          />

          <FormField
            label="Feedback"
            input={
              <DescriptionInput
                name="feedback"
                rows="5"
                style={{ resize: 'none', height: 'auto' }}
                onChange={updateFeedback}
                value={feedback}
                placeholder="Do you have any feedback to provide the contributor?"
                wide
              />
            }
          />

          <ReviewRow>
            <ReviewButton
              disabled={canSubmit()}
              mode="negative"
              onClick={onReject}
              icon={<IconCross />}
            >
              Reject
            </ReviewButton>
            <ReviewButton
              disabled={canSubmit()}
              icon={<IconCheck />}
              mode="positive"
              onClick={onAccept}
            >
              Accept
            </ReviewButton>
          </ReviewRow>

        </React.Fragment>
      )}

    </div>
  )
}

ReviewWork.propTypes = issueShape

const IssueLinkRow = styled.div`
  height: 31px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`
const SubmissionDetails = styled.div`
  border: 1px solid ${p => p.border};
  background-color: ${p => p.background};
  padding: ${2 * GU}px ${2 * GU}px 0 ${2 * GU}px;
  margin-bottom: ${2 * GU}px;
`
const UserLink = styled.div`
  display: flex;
  align-items: center;
`
const Separator = styled.hr`
  height: 1px;
  width: 100%;
  color: grey;
  opacity: 0.1;
`
const DetailText = styled(Text)`
  display: block;
  margin-bottom: 10px;
`
const ReviewRow = styled.div`
  display: flex;
  margin-bottom: 8px;
  justify-content: space-between;
`
const ReviewButton = styled(Button)`
  width: 48%;
`

export default ReviewWork
