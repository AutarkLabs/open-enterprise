import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { formatDistance } from 'date-fns'

import {
  Field,
  Text,
  TextInput,
  Button,
  Info,
  SafeLink,
} from '@aragon/ui'

import { FormField, FieldTitle } from '../../Form'
import { IconGitHub, CheckButton } from '../../Shared'

// external data, all of it
const application = {
  user: {
    login: 'rkzel',
    name: 'RKZ',
    avatar: 'https://avatars0.githubusercontent.com/u/34452131?v=4',
    url: "https://github.com/rkzel"
  },
  workplan: 'I solemnly swear to work on it day and night until it is done.',
  hours: 13,
  eta: '2/13/2019',
  applicationDate: '2/9/2019'
}

class ReviewApplication extends React.Component {
  static propTypes = {
    issue: PropTypes.object.isRequired
  }

  state = {
    feedback: ''
  }

  changeField = ({ target: { name, value } }) => this.setState({ [name]: value })

  onReviewApplicationAccept = () => {
    console.log('Accepted', this.state.feedback, application)
  }
  onReviewApplicationReject = () => {
    console.log('Rejected', this.state.feedback, application)
  }

  render() {
    const { issue } = this.props
    const applicant = application.user
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
            <Text style={{ marginLeft: '6px'}}>{issue.repo} #{issue.number}</Text>
          </IssueLinkRow>
        </SafeLink>

        <ApplicationDetails>
          <UserLink>
            <img src={applicant.avatar} style={{ width: '32px', height: '32px', marginRight: '10px'}} />
            <SafeLink
              href={applicant.url}
              target="_blank"
              style={{ textDecoration: 'none', color: '#21AAE7', marginRight: '6px' }}
            >
              {applicant.name ? applicant.name : applicant.login}
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

        <FormField
          label="Feedback"
          input={
            <TextInput.Multiline
              name='feedback'
              rows={3}
              style={{ resize: 'none', height: 'auto' }}
              onChange={this.changeField}
              placeholder="Do you have any feedback to provide the applicant?"
              wide
            />
          }
        />

        <ReviewRow>
          <ReviewButton emphasis="negative" onClick={this.onReviewApplicationReject}>Reject</ReviewButton>
          <ReviewButton emphasis="positive" onClick={this.onReviewApplicationAccept}>Accept</ReviewButton>
        </ReviewRow>
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
  margin-bottom: 14px;
`
const IssueTitle = styled(Text)`
  color: #717171;
  font-size: 17px;
  font-weight: 300;
  line-height: 38px;
`
const ReviewButton = styled(Button).attrs({
  mode: 'strong',
})`
  width: 190px;
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

export default ReviewApplication
