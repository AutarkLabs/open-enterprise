import PropTypes from 'prop-types'
import React from 'react'

import { DescriptionInput, Form, FormField, InputDropDown } from '../Form'
import { isNumberString, isStringEmpty } from '../../utils/helpers'

// TODO:: This should be votingTokens from account?
const AVAILABLE_TOKENS = ['ETH', 'ANT', 'GIV', 'FTL', '🦄']
const INITIAL_STATE = {
  address: '0xffffffffffffffffffffffffffffffffffffffff',
  description: '',
  limit: '',
  token: 0,
}

class NewAccount extends React.Component {
  static propTypes = {
    heading: PropTypes.string,
    onCreateAccount: PropTypes.func.isRequired,
  }

  state = INITIAL_STATE

  // TODO: improve field checking for input errors and sanitize
  changeField = e => {
    typeof e === 'number' // handle the token DropDown case
      ? this.setState({ token: e })
      : this.setState({ [e.target.name]: e.target.value })
  }

  createAccount = () => {
    const { address, description, token: tokenIndex, limit } = this.state
    if (isStringEmpty(description)) {
      return console.info(
        'The Account was not added: Description is not valid or empty, review the inputs'
      )
    }
    if (!isNumberString(limit) || isStringEmpty(limit)) {
      return console.info(
        'The account was not added: Limit is not valid or empty, review the inputs'
      )
    }

    const token = AVAILABLE_TOKENS[tokenIndex]
    this.props.onCreateAccount({
      address,
      description,
      token,
      limit,
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
          label="Description"
          input={
            <DescriptionInput
              name="description"
              placeholder="Describe your account/project for which you will be creating allocation votes."
              value={this.state.description}
              onChange={this.changeField}
            />
          }
        />
        <FormField
          required
          label="Limit"
          input={
            <InputDropDown
              textInput={{
                name: 'limit',
                value: this.state.limit,
                onChange: this.changeField,
                type: 'number',
                min: '0',
              }}
              dropDown={{
                name: 'token',
                items: AVAILABLE_TOKENS,
                active: this.state.token,
                onChange: this.changeField,
              }}
            />
          }
          hint="What sort of limits do you want to set per allocation vote?"
        />
      </Form>
    )
  }
}

export default NewAccount
