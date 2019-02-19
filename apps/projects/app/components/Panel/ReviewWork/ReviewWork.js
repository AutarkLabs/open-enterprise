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

// external Data
const work = {
  user: {
    login: 'rkzel',
    name: 'Radek',
    avatar: 'https://avatars0.githubusercontent.com/u/34452131?v=4',
    url: 'https://github.com/rkzel'
  },
  proof: 'https://github.com/AutarkLabs/planning-suite/pull/411',
  comments: 'This was an interesting challenge',
  hours: 13,
  submissionDate: '2/9/2019'
}

class ReviewWork extends React.Component {
  static propTypes = {
    issue: PropTypes.object.isRequired
  }

  state = {
    feedback: '',
    rating: 0,
    ratingAlert: false,
  }

  checkRating = (result) => {
    if (!this.state.rating) this.setState({ratingAlert: true})
    else {
      this.setState({ratingAlert: false})
      console.log(result, this.state.feedback, work)
    }
  }

  changeField = ({ target: { name, value } }) => this.setState({ [name]: value })

  onReviewApplicationAccept = () => {
    this.checkRating('Accepted')
  }
  onReviewApplicationReject = () => {
    this.checkRating('Rejected')
  }

  onRatingChange = index => {
    this.setState({rating: index})
    console.log('index: ', index)
  }

  render() {
    const { issue } = this.props
    const submitter = work.user
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
            <Text style={{ marginLeft: '6px'}}>{issue.repo} #{issue.number}</Text>
          </IssueLinkRow>
        </SafeLink>

        <SubmissionDetails>
          <UserLink>
            <img src={submitter.avatar} style={{ width: '32px', height: '32px', marginRight: '10px'}} />
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

          <CommentsCheck comments={work.comments} />
          <DetailText>{work.comments}</DetailText>

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
              rows={5}
              style={{ resize: 'none', height: 'auto' }}
              onChange={this.changeField}
              placeholder="Do you have any feedback to provide the contributor?"
              wide
            />
          }
        />

        <ReviewRow>
          <ReviewButton emphasis="negative" onClick={this.onReviewApplicationReject}>Reject</ReviewButton>
          <ReviewButton emphasis="positive" onClick={this.onReviewApplicationAccept}>Accept</ReviewButton>
        </ReviewRow>

        <AlertArea>
          <RatingAlert alert={this.state.ratingAlert} />
        </AlertArea>
        
      </div>
    )
  }

}

function CommentsCheck(props) {
  return props.comments ? <FieldTitle>Additional Comments</FieldTitle> : null
}

function RatingAlert(props) {
  return props.alert ? <Info.Alert>Please select a quality rating</Info.Alert> : null
}

const IssueTitle = styled(Text)`
  color: ${theme.textSecondary};
  font-size: 17px;
  font-weight: 300;
  line-height: 38px;
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
const ReviewButton = styled(Button).attrs({
  mode: 'strong',
})`
  width: 48%;
`

export default ReviewWork
