import PropTypes from 'prop-types'
import React from 'react'
import { Info, TextInput } from '@aragon/ui'

import { Form, FormField } from '../Form'
import { isStringEmpty } from '../../utils/helpers'

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
    if (e.target.name === 'name') {
      if (isStringEmpty(e.target.value)) {
        this.setState({ nameError: true })
      }
      else {
        this.setState({ nameError: false })
      }
    }
    else if (e.target.name === 'amount') {
      if (isStringEmpty(e.target.value) || e.target.value <= 0) {
        this.setState({ amountError: true })
      }
      else {
        this.setState({ amountError: false })
      }
    }
    this.setState({ [e.target.name]: e.target.value })
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

    return (
      <React.Fragment>


        <Form
          onSubmit={this.createBudget}
          // heading={this.props.heading}
          submitText="Create budget"
          disabled={this.state.nameError || this.state.amountError}
        >
          <FormField
            required
            label="name"
            input={
              <TextInput
                name="name"
                onChange={this.changeField}
                wide={true}
                value={this.state.name}
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
                onChange={this.changeField}
                wide={true}
                value={this.state.amount}
              />
            }
          />
        </Form>

        {this.state.nameError && <Info
          background="#fb79790f"
          title="Error"
          style={{ margin: '20px 0' }}
        >
          The name of the budget is required.
        </Info>
        }

        {this.state.amountError && <Info
          background="#fb79790f"
          title="Error"
          style={{ margin: '20px 0' }}
        >
          The entered amount is invalid.
        </Info>
        }
        
      </React.Fragment>
    )
  }
}

// eslint-disable-next-line import/no-unused-modules
export default NewBudget
