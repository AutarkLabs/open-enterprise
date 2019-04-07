import PropTypes from 'prop-types'
import React from 'react'

import { DescriptionInput, Form, FormField, InputDropDown } from '../Form'
import { isStringEmpty } from '../../utils/helpers'

// TODO:: This should be votingTokens from account?
const INITIAL_STATE = {
  description: '',
}

class NewAccount extends React.Component {
  static propTypes = {
    heading: PropTypes.string,
    onCreateAccount: PropTypes.func.isRequired
  }

  state =  INITIAL_STATE

  // TODO: improve field checking for input errors and sanitize
  changeField = e => {
    typeof e === 'number' // handle the token DropDown case
      ? this.setState({ token: e })
      : this.setState({ [e.target.name]: e.target.value })
  }

  createAccount = () => {
    const { description, } = this.state
    if (isStringEmpty(description)) {
      return console.info(
        'The Account was not added: Description is not valid or empty, review the inputs'
      )
    }

    this.props.onCreateAccount({
      description,
    })
    this.setState(INITIAL_STATE)
  }

  render() {

    return (
      <Form
        onSubmit={this.createAccount}
        // heading={this.props.heading}
        submitText="Create Account"
      >
        <FormField
          required
          label="Name"
          input={
            <DescriptionInput
              name="description"
              placeholder="Name the account that will be used for allocations."
              value={this.state.description}
              onChange={this.changeField}
            />
          }
        />
      </Form>
    )
  }
}

export default NewAccount
