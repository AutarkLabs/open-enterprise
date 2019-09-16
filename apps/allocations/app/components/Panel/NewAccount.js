import PropTypes from 'prop-types'
import React from 'react'
import { Info } from '@aragon/ui'

import { DescriptionInput, Form, FormField } from '../Form'
import { isStringEmpty } from '../../utils/helpers'

// TODO:: This should be votingTokens from account?
const INITIAL_STATE = {
  description: '',
  descriptionError: false,
}

class NewAccount extends React.Component {
  static propTypes = {
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
      // eslint-disable-next-line no-console
      this.setState({ descriptionError: true })
      return
    }

    this.props.onCreateAccount({
      description,
    })
    this.setState(INITIAL_STATE)
  }

  render() {

    return (
      <React.Fragment>
        {this.state.descriptionError && <Info
          background="#fb79790f"
          title="Error"
          style={{ margin: '20px 0' }}
        >
          A description of the account is required.
        </Info>
        }

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

        <Info.Action title="Warning" style={{ marginTop: '20px' }}>
          Allocation accounts can hold and transfer ETH, and while they cannot hold tokens, they have the ability to send tokens that your organization holds in the connected Vault. Use wisely!
        </Info.Action>
      </React.Fragment>
    )
  }
}

// eslint-disable-next-line import/no-unused-modules
export default NewAccount
