import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { formatDistance } from 'date-fns'
import {
  Button,
  DropDown,
  GU,
  IconCheck,
  IconCross,
  Link,
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
import { IssueTitle } from '../PanelComponents'

const ReviewApplication = ({ issue, requestIndex }) => {
  const githubCurrentUser = useGithubAuth()
  const {
    api: { reviewApplication },
  } = useAragonApi()
  const { closePanel } = usePanelManagement()
  const theme = useTheme()

  const [ feedback, setFeedback ] = useState('')
  const [ index, setIndex ] = useState(requestIndex)

  const updateFeedback = e => setFeedback(e.target.value)

  const buildReturnData = approved => {
    const today = new Date()
    return {
      feedback,
      approved,
      user: githubCurrentUser,
      reviewDate: today.toISOString(),
    }
  }

  const onAccept = () => onReviewApplication(true)
  const onReject = () => onReviewApplication(false)
  const changeRequest = (index) => setIndex(index)

  const onReviewApplication = async (approved) => {
    closePanel()
    const review = buildReturnData(approved)
    // new IPFS data is old data plus state returned from the panel
    const ipfsData = issue.requestsData[index]
    const requestIPFSHash = await ipfsAdd({ ...ipfsData, review })

    reviewApplication(
      toHex(issue.repoId),
      issue.number,
      issue.requestsData[index].contributorAddr,
      requestIPFSHash,
      approved
    ).toPromise()
  }

  const request = issue.requestsData[index]
  const application = {
    user: {
      login: request.user.login,
      name: request.user.login,
      avatar: request.user.avatarUrl,
      url: request.user.url
    },
    workplan: request.workplan,
    hours: request.hours,
    eta: (request.eta === '-') ? request.eta : (new Date(request.eta)).toLocaleDateString(),
    applicationDate: request.applicationDate
  }

  const applicant = application.user
  const applicantName = applicant.name ? applicant.name : applicant.login
  const applicationDateDistance = formatDistance(new Date(application.applicationDate), new Date())

  return (
    <div css={`margin: ${2 * GU}px 0`}>
      <IssueTitle issue={issue} />

      <FieldTitle>Applicant</FieldTitle>
      <DropDown
        name="Applicant"
        items={issue.requestsData.map(request => request.user.login)}
        onChange={changeRequest}
        selected={index}
        wide
      />

      <ApplicationDetails background={`${theme.background}`} border={`${theme.border}`}>
        <UserLink>
          <img
            alt=""
            src={applicant.avatar}
            css="width: 32px; height: 32px; margin-right: 10px; border-radius: 50%;"
          />
          <Link
            href={applicant.url}
            target="_blank"
            style={{ textDecoration: 'none', color: `${theme.link}`, marginRight: 6 }}
          >
            {applicantName}
          </Link>
            applied {applicationDateDistance} ago
        </UserLink>

        <Separator/>

        <FieldTitle>Work Plan</FieldTitle>
        <DetailText>{application.workplan}</DetailText>

        <Estimations>
          <div>
            <FieldTitle>Estimated Hours</FieldTitle>
            <DetailText>{application.hours}</DetailText>
          </div>
          <div>
            <FieldTitle>Estimated Completion</FieldTitle>
            <DetailText>{application.eta}</DetailText>
          </div>
        </Estimations>
      </ApplicationDetails>

      {('review' in request) ? (
        <React.Fragment>

          <FieldTitle>Application Status</FieldTitle>
          <div css="margin: 10px 0">
            {request.review.approved ? (
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
            {request.review.feedback.length ? request.review.feedback : 'No feedback was provided'}
          </Text.Block>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <FormField
            label="Feedback"
            input={
              <TextInput.Multiline
                name='feedback'
                rows="3"
                onChange={updateFeedback}
                placeholder="Do you have any feedback to provide the applicant?"
                value={feedback}
                wide
              />
            }
          />
          <ReviewRow>
            <ReviewButton
              mode="negative"
              onClick={onReject}
              icon={<IconCross />}
              label="Reject"
            />
            <ReviewButton
              mode="positive"
              onClick={onAccept}
              icon={<IconCheck />}
              label="Accept"
            />
          </ReviewRow>
        </React.Fragment>
      )}

    </div>
  )
}
ReviewApplication.propTypes = {
  issue: issueShape,
  requestIndex: PropTypes.number.isRequired,
}

const UserLink = styled.div`
  display: flex;
  align-items: center;
`
const DetailText = styled(Text)`
  display: block;
  margin-bottom: 10px;
`
const Separator = styled.hr`
  height: 1px;
  width: 100%;
  color: #d1d1d1;
  opacity: 0.1;
`
const ApplicationDetails = styled.div`
  border: 1px solid ${p => p.border};
  background-color: ${p => p.background};
  padding: 14px;
  margin-top: 8px;
  margin-bottom: 14px;
`
const ReviewButton = styled(Button)`
  width: 48%;
`
const ReviewRow = styled.div`
  display: flex;
  margin-bottom: 8px;
  justify-content: space-between;
`
const Estimations = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto;
  grid-gap: 12px;
`

export default ReviewApplication
