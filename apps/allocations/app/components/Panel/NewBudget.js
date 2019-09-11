import PropTypes from 'prop-types'
import React from 'react'
import { TextInput } from '@aragon/ui'

import { Form, FormField } from '../Form'
import { isStringEmpty } from '../../utils/helpers'
import { MIN_AMOUNT } from '../../utils/constants'

// TODO:: This should be votingTokens from account?
const INITIAL_STATE = {
  name: '',
  nameError: true,
  amount: '',
  amountError: true,
}

class NewBudget extends React.Component {
  static propTypes = {
    onCreateBudget: PropTypes.func.isRequired
  }

  state =  INITIAL_STATE

  changeField = e => {
    const { name, value } = e.target
    this.setState({ [e.target.name]: e.target.value })
    this.setState({ [name + 'Error']: isStringEmpty(value) ||
                    (name === 'amount' && value < MIN_AMOUNT) })
  }

  createBudget = () => {
    const { name, amount } = this.state

    this.props.onCreateBudget({
      name,
      amount,
    })
    this.setState(INITIAL_STATE)
  }

  render() {

    const { name, nameError, amount, amountError } = this.state

    return (
      <React.Fragment>


        <Form
          onSubmit={this.createBudget}
          // heading={this.props.heading}
          submitText="Create budget"
          disabled={nameError || amountError}
        >
          <FormField
            required
            label="name"
            input={
              <TextInput
                name="name"
                onChange={this.changeField}
                wide={true}
                value={name}
              />
            }
          />
          <FormField
            required
            label="amount"
            input={
              <TextInput
                name="amount"
                type="number"
                min={MIN_AMOUNT}
                onChange={this.changeField}
                wide={true}
                value={amount}
              />
            }
          />
        </Form>
      </React.Fragment>
    )
  }
}

// eslint-disable-next-line import/no-unused-modules
export default NewBudget
