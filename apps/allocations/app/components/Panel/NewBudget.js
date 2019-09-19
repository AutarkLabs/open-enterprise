import PropTypes from 'prop-types'
import React from 'react'
import { DropDown, IconClose, Info, TextInput, theme } from '@aragon/ui'
import styled from 'styled-components'

import { Form, FormField } from '../Form'
import { isStringEmpty } from '../../utils/helpers'
import { BigNumber } from 'bignumber.js'
import { ETH_DECIMALS, MIN_AMOUNT } from '../../utils/constants'

// TODO:: This should be votingTokens from account?
const INITIAL_STATE = {
  name: '',
  nameError: true,
  amount: '',
  amountError: true,
  amountOverFunds: false,
  currency: 0,
  buttonText: 'Create budget'
}

class NewBudget extends React.Component {
  static propTypes = {
    onCreateBudget: PropTypes.func.isRequired,
    editingBudget: PropTypes.object,
    fundsLimit: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    this.state =  INITIAL_STATE
    if (props.editingBudget) {
      this.state.name = props.editingBudget.data.name
      this.state.nameError = false
      this.state.amount = BigNumber(props.editingBudget.data.amount)
        .div(ETH_DECIMALS)
      this.state.amountError = false
      this.state.currency = props.editingBudget.data.currency === 'ETH' ? 0 : 1 // change this!!
      this.state.buttonText = 'Submit'
    }
  }

  changeField = e => {
    const { name, value } = e.target
    const { fundsLimit } = this.props
    this.setState({
      [name]: value,
      [name + 'Error']: isStringEmpty(value)
    })
    if (name === 'amount') {
      const numericValue = BigNumber(value)
      this.setState({
        amountError: numericValue.lt(MIN_AMOUNT),
        amountOverFunds: numericValue.gt(fundsLimit)
      })
    }
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

    const {
      name,
      nameError,
      amount,
      amountError,
      amountOverFunds,
      currency,
      buttonText
    } = this.state

    return (
      <Form
        onSubmit={this.createBudget}
        submitText={buttonText}
        disabled={nameError || amountError || amountOverFunds}
        errors={
          <div>
            { amountOverFunds && (
              <ErrorText>
                <IconClose
                  size="tiny"
                  css={{
                    marginRight: '8px',
                    marginBottom: '2px',
                    color: theme.negative,
                  }}
                />
                Amount must be smaller than underlying funds
              </ErrorText>
            )}
            { this.props.editingBudget && (
              <Info>
                Please keep in mind that any changes to the budget amount may only be effectuated upon the starting date of the next accounting period.
              </Info>
            ) }
          </div>
        }
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
                step="any"
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

const ErrorText = styled.div`
  font-size: small;
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`

// eslint-disable-next-line import/no-unused-modules
export default NewBudget
