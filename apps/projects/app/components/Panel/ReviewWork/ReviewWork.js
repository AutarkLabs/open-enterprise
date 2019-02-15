
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
  DropDown
} from '@aragon/ui'

import { FormField, FieldTitle } from '../../Form'
import { IconGitHub, CheckButton } from '../../Shared'

// external Data
const work = {
  user: {
    login: 'rkzel',
    name: 'RKZ',
    avatar: 'https://avatars0.githubusercontent.com/u/34452131?v=4',
    url: 'https://github.com/rkzel'
  },
  proof: 'https://github.com/AutarkLabs/planning-suite/pull/411',
  comments: 'such fun!',
  hours: 13,
}
class ReviewWork extends React.Component {

  state = {
    feedback: '',
    rating: 5,
  }

  changeField = ({ target: { name, value } }) => this.setState({ [name]: value })

  onReviewApplicationAccept = () => {
    console.log('Accepted', this.state.feedback, application)
  }
  onReviewApplicationReject = () => {
    console.log('Rejected', this.state.feedback, application)
  }

  generateRatingChange = () => index => {
    this.setState({rating: index})
    console.log('index: ', index)
  }


  render() {
    const ratings = [ 
      '5 - Excellent',
      '4 - Exceeds Expectations',
      '3 - Acceptable',
      '2 - Needs Rework', 
      '1 - Unusable', 
    ]
    return(
      //<div>Review Work Please NOW</div>
      <div>
        <FieldTitle>Quality Rating</FieldTitle>
        <DropDown
          items={ratings}
          onChange={this.generateRatingChange()}
          active={this.state.rating}
        />
      </div>
    )
  }

}

//ReviewWork.propTypes = {
//  /** array of issues to allocate bounties on */
//  issues: PropTypes.arrayOf(
//    PropTypes.shape({
//      id,
//      level,
//    })
//  ),
//  /** base rate in pennies */
//  rate: PropTypes.number,
//  /** callback fn */
//  onSubmit: PropTypes.func,
//}

export default ReviewWork
