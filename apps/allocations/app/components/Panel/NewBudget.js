import PropTypes from 'prop-types'
import React from 'react'
import { DropDown, TextInput } from '@aragon/ui'
import styled from 'styled-components'

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
            <InputGroup>
              <TextInput
                name="amount"
                type="number"
                min={MIN_AMOUNT}
                onChange={this.changeField}
                wide={true}
                value={amount}
                css={{ borderRadius: '4px 0px 0px 4px' }}
              />
              <DropDown
                name="currency"
                css={{ borderRadius: '0px 4px 4px 0px' }}
                items={[ 'ETH', 'DAI' ]}
                selected={0}
              />
            </InputGroup>
          }
        />
      </Form>
    )
  }
}

const InputGroup = styled.div`
  display: flex;
`

// eslint-disable-next-line import/no-unused-modules
export default NewBudget
