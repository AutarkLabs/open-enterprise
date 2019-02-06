import PropTypes from 'prop-types'
import React from 'react'

import {
  DescriptionInput,
  Form,
  FormField,
  DropDownOptionsInput,
} from '../../Form'

class NewIssueCuration extends React.Component {
  static propTypes = {
    /** array of issues to allocate bounties on */
    issues: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        number: PropTypes.number,
        repo: PropTypes.string,
      })
    ),
    /** base rate in pennies */
    // rate: PropTypes.number,
    // onSubmit: PropTypes.func,
  }
  // TODO: Work with only id fields when possible and read rest of data from cache with a context helper
  state = { curatedIssues: this.props.issues, issuesInput: '' }

  // TODO: improve field checking for input errors and sanitize
  changeField = ({ target: { name, value } }) => {
    this.setState({ [name]: value })
  }

  submitCuration = () => {
    // console.info('Submitting new curation', this.state, this.props)
    this.props.onSubmit(this.state.curatedIssues)
  }

  render() {
    return (
      <Form onSubmit={this.submitCuration} submitText="Submit Curation">
        {false &&
        <FormField
          required
          label="Description"
          input={
            <DescriptionInput
              name="description"
              onChange={this.changeField}
              placeholder="Describe your proposal."
              value={this.state.description}
            />
          }
        />
        }
        <FormField
          label="Issues"
          required
          input={
            <DropDownOptionsInput
              name="issues"
              placeholder="Select option..."
              onChange={this.changeField}
              value={this.state.curatedIssues}
              input={this.state.issuesInput}
            />
          }
        />
      </Form>
    )
  }
}

export default NewIssueCuration
