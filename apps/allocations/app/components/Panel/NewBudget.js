import PropTypes from 'prop-types'
import React from 'react'
import { DropDown, TextInput } from '@aragon/ui'
import styled from 'styled-components'

import { Form, FormField } from '../Form'
import { isStringEmpty } from '../../utils/helpers'
import { BigNumber } from 'bignumber.js'
import { MIN_AMOUNT } from '../../utils/constants'

// TODO:: This should be votingTokens from account?
const INITIAL_STATE = {
  name: '',
  nameError: true,
  amount: '',
  amountError: true,
  currency: 0,
}

class NewBudget extends React.Component {
  static propTypes = {
    onCreateBudget: PropTypes.func.isRequired,
    connectedAccount: PropTypes.string
  }

  state =  INITIAL_STATE

  changeField = e => {
    const { name, value } = e.target
    this.setState({
      [name]: value,
      [name + 'Error']: isStringEmpty(value) ||
        (name === 'amount' && BigNumber(value).lt(MIN_AMOUNT))
    })
  }

  createBudget = () => {
    const { name, amount } = this.state

    this.props.onCreateBudget({
      description: name,
      amount,
    })
    this.setState(INITIAL_STATE)
  }

  render() {

    const { connectedAccount } = this.props
    const { name, nameError, amount, amountError, currency } = this.state

    return (
      <Form
        onSubmit={this.createBudget}
        submitText="Create budget"
        disabled={nameError || amountError || !connectedAccount}
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
                step={0.1}
                onChange={this.changeField}
                wide={true}
                value={amount}
                css={{ borderRadius: '4px 0px 0px 4px' }}
              />
              <DropDown
                name="currency"
                css={{ borderRadius: '0px 4px 4px 0px' }}
                items={[ 'ETH', 'DAI' ]}
                selected={currency}
                onChange={e => this.setState({ currency: e })}
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
