import PropTypes from 'prop-types'
import React from 'react'

import {
  DescriptionInput,
  DropDownOptionsInput,
  Form,
  FormField,
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
    this.props.onSubmit(this.state.curatedIssues, this.state.description)
  }

  render() {
    return (
      <Form onSubmit={this.submitCuration} submitText="Submit Curation">
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
        <FormField
          label="Issues"
          required
          input={
            <DropDownOptionsInput
              name="issues"
              placeholder="Select option..."
              onChange={this.changeField}
              values={this.state.curatedIssues}
              input={this.state.issuesInput}
            />
          }
        />
      </Form>
    )
  }
}

export default NewIssueCuration
