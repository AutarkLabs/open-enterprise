import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { formatDistance } from 'date-fns'

import {
  Text,
  Button,
  SafeLink,
  DropDown,
  IconCheck,
  IconCross,
  theme,
} from '@aragon/ui'

import { Form, FormField, FieldTitle, DescriptionInput } from '../../Form'
import { IconGitHub } from '../../Shared'

// external data, all of it

class ReviewApplication extends React.Component {
  static propTypes = {
    issue: PropTypes.object.isRequired
  }

  state = {
    feedback: '',
    requestIndex: 0
  }

  changeField = ({ target: { name, value } }) => this.setState({ [name]: value })

  buildReturnData = approved => {
    let today = new Date()
    return {
      feedback: this.state.feedback,
      approved,
      user: this.props.githubCurrentUser,
      reviewDate: today.toISOString(),
    }
  }

  onAccept = () => {
    const returnData = this.buildReturnData(true)
    this.props.onReviewApplication(this.props.issue, this.state.requestIndex, true, returnData)
  }

  onReject = () => {
    const returnData = this.buildReturnData(false)
    this.props.onReviewApplication(this.props.issue, this.state.requestIndex, false, returnData)
  }

  changeRequest = (index) => {
    this.setState({ requestIndex: index })
  }


  render() {
    const { issue } = this.props
    const request = issue.requestsData[this.state.requestIndex]
    const application = {
      user: {
        login: request.user.login,
        name: request.user.login,
        avatar: request.user.avatarUrl,
        url: request.user.url
      },
      workplan: request.workplan,
      hours: request.hours,
      eta: (new Date(request.eta)).toLocaleDateString(),
      applicationDate: request.applicationDate
    }

    const applicant = application.user
    const applicantName = applicant.name ? applicant.name : applicant.login
    const applicationDateDistance = formatDistance(new Date(application.applicationDate), new Date())
    return (
      <div>
        <IssueTitle>{issue.title}</IssueTitle>

        <SafeLink
          href={issue.url}
          target="_blank"
          style={{ textDecoration: 'none', color: '#21AAE7' }}
        >
          <IssueLinkRow>
            <IconGitHub color="#21AAE7" width='14px' height='14px' />
            <Text style={{ marginLeft: '6px' }}>{issue.repo} #{issue.number}</Text>
          </IssueLinkRow>
        </SafeLink>

        <FieldTitle>Applicant</FieldTitle>
        <DropDown
          name="Applicant"
          items={issue.requestsData.map( request => request.user.login)}
          onChange={this.changeRequest}
          active={this.state.requestIndex}
          wide
        />

        <ApplicationDetails>
          <UserLink>
            <img src={applicant.avatar} style={{ width: '32px', height: '32px', marginRight: '10px' }} />
            <SafeLink
              href={applicant.url}
              target="_blank"
              style={{ textDecoration: 'none', color: '#21AAE7', marginRight: '6px' }}
            >
              {applicantName}
            </SafeLink>
            applied {applicationDateDistance} ago
          </UserLink>

          <Separator/>

          <FieldTitle>Work Plan</FieldTitle>
          <DetailText>{application.workplan}</DetailText>

          <FieldTitle>Estimated Hours</FieldTitle>
          <DetailText>{application.hours}</DetailText>

          <FieldTitle>Estimated Completion</FieldTitle>
          <DetailText>{application.eta}</DetailText>
        </ApplicationDetails>

        {('review' in request) ? (
          <React.Fragment>

            <FieldTitle>Application Status</FieldTitle>
          
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
              {request.review.approved ? (
                <div>
                  <IconCheck /> <Text size="small" color={theme.positive}>Accepted</Text>
                </div>
              ) : (
                <div>
                  <IconCross /> <Text size="small" color={theme.negative}>Rejected</Text>
                </div>
              )}
              <div>
                {formatDistance(new Date(request.review.reviewDate), new Date())} ago
              </div>
            
            </div>

            <ReviewCard>
              <IssueEventAvatar>
                <img src={request.review.user.avatarUrl} alt="user avatar" style={{ width: '50px' }} />
              </IssueEventAvatar>
              
              <div>
                <Text.Block size="small">
                  <SafeLink
                    href={request.review.user.url}
                    target="_blank"
                    style={{ textDecoration: 'none', color: '#21AAE7' }}
                  >
                    {request.review.user.login}
                  </SafeLink> {
                    request.review.approved ? 'assigned ' + applicantName : 'rejected ' + applicantName}
                </Text.Block>
                {request.review.feedback.length === 0 ?
                  null
                  :
                  <Text>{request.review.feedback}</Text>
                }
              </div>
            </ReviewCard>
          </React.Fragment>
        ) : (
          <React.Fragment>

            <FormField
              label="Feedback"
              input={
                <DescriptionInput
                  name='feedback'
                  rows="3"
                  onChange={this.changeField}
                  placeholder="Do you have any feedback to provide the applicant?"
                  value={this.state.feedback}
                />
              }
            />

            <ReviewRow>
              <ReviewButton
                emphasis="negative"
                onClick={this.onReject}
              >
            Reject
              </ReviewButton>
              <ReviewButton
                emphasis="positive"
                onClick={this.onAccept}
              >
            Accept
              </ReviewButton>
            </ReviewRow>
          </React.Fragment>
        )}

      </div>
    )
  }
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
  color: #D1D1D1;
  opacity: 0.1;
`
const ApplicationDetails = styled.div`
  border: 1px solid #DAEAEF;
  background-color: #F3F9FB;
  padding: 14px;
  margin-top: 8px;
  margin-bottom: 14px;
`
const IssueTitle = styled(Text)`
  color: #717171;
  font-size: 17px;
  font-weight: 300;
  line-height: 1.5;
  margin-bottom: 10px;
`

const ReviewButton = styled(Button).attrs({
  mode: 'strong',
})`
  width: 48%;
`
const ReviewRow = styled.div`
  display: flex;
  margin-bottom: 8px;
  justify-content: space-between;
`
const IssueLinkRow = styled.div`
  height: 31px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`
const ReviewCard = styled.div`
  display: flex;
  text-align: left;
  padding: 15px 30px;
  margin: 0;
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
`
const IssueEventAvatar = styled.div`
  width: 66px;
  margin: 0;
`

export default ReviewApplication
