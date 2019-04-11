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
  Badge,
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
    const submitterName = submitter.name ? submitter.name : submitter.login
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
              {submitterName}
            </SafeLink>
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
          
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
              {work.review.accepted ? (
                <div>
                  <IconCheck /> <Text size="small" color={theme.positive}>Accepted</Text>
                </div>
              ) : (
                <div>
                  <IconCross /> <Text size="small" color={theme.negative}>Rejected</Text>
                </div>
              )}
              <div>
                {formatDistance(new Date(work.review.reviewDate), new Date())} ago
              </div>
            
            </div>

            <ReviewCard>
              <IssueEventAvatar>
                <img src={work.review.user.avatarUrl} alt="user avatar" style={{ width: '50px' }} />
              </IssueEventAvatar>
              
              <div>
                <Text.Block size="small">
                  <SafeLink
                    href={work.review.user.url}
                    target="_blank"
                    style={{ textDecoration: 'none', color: '#21AAE7' }}
                  >
                    {work.review.user.login}
                  </SafeLink> {
                    work.review.accepted ?
                      'accepted ' + submitterName + '\'s work'
                      :
                      'rejected ' + submitterName + '\'s work'
                  }
                </Text.Block>
                {work.review.feedback.length === 0 ?
                  null
                  :
                  <Text.Block style={{ marginBottom: '8px' }}>
                    {work.review.feedback}
                  </Text.Block>
                }
                <Badge
                  foreground={theme.textSecondary}
                  background={theme.contentBorder}
                >Quality: {work.review.rating}</Badge>
              </div>
            </ReviewCard>
          </React.Fragment>
        ) : (
          <React.Fragment>

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
                  name="feedback"
                  rows="5"
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
          </React.Fragment>
        )}

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

export default ReviewWork
