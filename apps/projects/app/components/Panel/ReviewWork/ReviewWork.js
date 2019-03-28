import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { formatDistance } from 'date-fns'

import {
  Text,
  TextInput,
  Button,
  Info,
  SafeLink,
  DropDown,
  theme,
} from '@aragon/ui'

import { FormField, FieldTitle, DescriptionInput } from '../../Form'
import { IconGitHub } from '../../Shared'

class ReviewWork extends React.Component {
  static propTypes = {
    issue: PropTypes.object.isRequired
  }

  state = {
    feedback: '',
    rating: 0,
  }

  changeField = ({ target: { name, value } }) => this.setState({ [name]: value })

  onAccept = () => {
    const today = new Date()
    this.props.onReviewWork({
      ...this.state,
      accepted: true,
      user: this.props.githubCurrentUser,
      reviewDate: today.toISOString(),
    }, this.props.issue)
  }

  canSubmit = () => !(this.state.rating > 0)

  onReject = () => {
    const today = new Date()
    this.props.onReviewWork({
      ...this.state,
      accepted: false,
      user: this.props.githubCurrentUser,
      reviewDate: today.toISOString(),
    }, this.props.issue)
  }

  onRatingChange = index => {
    this.setState({ rating: index })
    console.log('index: ', index)
  }

  render() {
    const { issue } = this.props

    const work = issue.work
    const submitter = issue.work.user
    const submissionDateDistance = formatDistance(new Date(work.submissionDate), new Date())

    const ratings = [
      'Select a Rating',
      '1 - Unusable', 
      '2 - Needs Rework', 
      '3 - Acceptable',
      '4 - Exceeds Expectations',
      '5 - Excellent',
    ]

    return(
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

        <SubmissionDetails>
          <UserLink>
            <img src={submitter.avatarUrl} style={{ width: '32px', height: '32px', marginRight: '10px' }} />
            <SafeLink
              href={submitter.url}
              target="_blank"
              style={{ textDecoration: 'none', color: '#21AAE7', marginRight: '6px' }}
            >
              {submitter.name ? submitter.name : submitter.login}
            </SafeLink>
            applied {submissionDateDistance} ago
          </UserLink>

          <Separator/>

          <FieldTitle>Proof of Work</FieldTitle>
          <SafeLink
            href={work.proof}
            target="_blank"
            style={{ textDecoration: 'none', color: '#21AAE7' }}
          >
            <DetailText>{work.proof}</DetailText>
          </SafeLink>

          {work.comments && <FieldTitle>Additional Comments</FieldTitle>}
          {work.comments && <DetailText>{work.comments}</DetailText>}

          <FieldTitle>Hours Worked</FieldTitle>
          <DetailText>{work.hours}</DetailText>

        </SubmissionDetails>

        <FormField
          label="Quality Rating" 
          required
          input={
            <DropDown
              items={ratings}
              onChange={this.onRatingChange}
              active={this.state.rating}
            />
          }
        />

        <FormField
          label="Feedback"
          input={
            <DescriptionInput
              name='feedback'
              rows={'5'}
              style={{ resize: 'none', height: 'auto' }}
              onChange={this.changeField}
              value={this.state.feedback}
              placeholder="Do you have any feedback to provide the contributor?"
              wide
            />
          }
        />

        <ReviewRow>
          <ReviewButton
            disabled={this.canSubmit()}
            emphasis="negative"
            mode={this.canSubmit() ? 'secondary' : 'strong'}
            onClick={this.onReject}
          >
            Reject
          </ReviewButton>
          <ReviewButton
            disabled={this.canSubmit()}
            emphasis="positive"
            mode={this.canSubmit() ? 'secondary' : 'strong'}
            onClick={this.onAccept}
          >
            Accept
          </ReviewButton>
        </ReviewRow>
        
      </div>
    )
  }
}

const IssueTitle = styled(Text)`
  color: ${theme.textSecondary};
  font-size: 17px;
  font-weight: 300;
  line-height: 1.5;
  margin-bottom: 10px;
`
const IssueLinkRow = styled.div`
  height: 31px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`
const SubmissionDetails = styled.div`
  border: 1px solid ${theme.contentBorder};
  background-color: ${theme.shadow};
  padding: 14px;
  margin-bottom: 14px;
`
const UserLink = styled.div`
  display: flex;
  align-items: center;
`
const Separator = styled.hr`
  height: 1px;
  width: 100%;
  color: ${theme.contentBorder};
  opacity: 0.1;
`
const DetailText = styled(Text)`
  display: block;
  margin-bottom: 10px;
`
const AlertArea = styled.div`
  padding: 14px
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
