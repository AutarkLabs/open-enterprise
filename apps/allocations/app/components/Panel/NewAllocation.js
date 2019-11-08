import PropTypes from 'prop-types'
import React from 'react'
import { DropDown, GU, IconClose, Text, TextInput, font, theme } from '@aragon/ui'
import web3Utils from 'web3-utils'
import styled from 'styled-components'
import { BigNumber } from 'bignumber.js'

import { RecipientsInput } from '../../../../../shared/ui'
import { MIN_AMOUNT } from '../../utils/constants'
import { displayCurrency, isStringEmpty } from '../../utils/helpers'
import { DescriptionInput, Form, FormField } from '../Form'
import CurrencyBox from '../Form/Field/CurrencyBox'

const INITIAL_STATE = {
  budgetValue: {},
  budgetEmpty: true,
  descriptionValue: '',
  descriptionEmpty: true,
  amountValue: '',
  amountInvalid: true,
  amountOverBudget: false,
  amountOverFunds: false,
  recipients: {},
  recipientsValid: {},
  recipientsDuplicate: false,
  tokenValue: {},
}

const errorMessages = {
  amountOverBudget: 'Amount must be smaller than available budget',
  amountOverFunds: 'Amount must be smaller than funds available in Vault',
  recipientsDuplicate: 'Recipients must be unique',
}

const isRecipientValid = (current) => {
  return web3Utils.isAddress(current)
}

const recipientsDuplicate = (recipients) => {
  const values = Object.values(recipients)
  const set = new Set(values)
  return set.size !== values.length
}

class NewAllocation extends React.Component {
  static propTypes = {
    budgetId: PropTypes.string.isRequired,
    onSubmitAllocation: PropTypes.func.isRequired,
    budgets: PropTypes.arrayOf(PropTypes.object).isRequired,
    balances: PropTypes.arrayOf(PropTypes.object).isRequired,
  }

  constructor(props) {
    super(props)
    const { budgets, budgetId } = props
    this.state = INITIAL_STATE
    this.state.recipients = {}
    this.state.recipientsValid = {}
    const recipientId = Date.now()
    this.state.recipients[recipientId] = ''
    this.state.recipientsValid[recipientId] = false
    if (budgetId !== undefined) {
      const budgetValue = budgets.find(b => b.id === budgetId)
      this.state.budgetValue = budgetValue
      this.state.budgetEmpty = false
      this.state.tokenValue = props.balances.find(
        b => b.symbol === budgetValue.token.symbol
      )
    }
  }

  changeField = e => {
    const { name, value } = e.target
    const { balances } = this.props
    const { recipients, recipientsValid, budgetValue, tokenValue } = this.state

    if (name === 'budget') {
      this.setState({
        budgetValue: value,
        budgetEmpty: false,
        tokenValue: balances.find(b => b.symbol === value.token.symbol)
      })
    }

    else if (name === 'description') {
      this.setState({
        descriptionValue: value,
        descriptionEmpty: isStringEmpty(value),
      })
    }

    else if (name === 'amount') {
      this.setState({
        amountValue: value,
        amountInvalid: isStringEmpty(value)
          || BigNumber(value).lt(MIN_AMOUNT),
        amountOverBudget: BigNumber(value + 'e18').gt(budgetValue.amount),
        amountOverFunds: BigNumber(value + 'e18').gt(tokenValue.amount),
      })
    }

    else if (name === 'recipientsChange') {
      recipients[e.target.id] = value
      recipientsValid[e.target.id] = isRecipientValid(value)
      this.setState({
        recipients,
        recipientsValid,
        recipientsDuplicate: recipientsDuplicate(recipients),
      })
    }

    else if (name === 'recipientsAdd') {
      const id = Date.now()
      this.setState({
        recipients: { [id]: '', ...recipients },
        recipientsValid: { [id]: false, ...recipientsValid },
        recipientsDuplicate: recipientsDuplicate(recipients),
      })
    }

    else if (name === 'recipientsRemove') {
      delete recipients[e.target.id]
      delete recipientsValid[e.target.id]
      this.setState({
        recipients,
        recipientsValid,
        recipientsDuplicate: recipientsDuplicate(recipients),
      })
    }
  }

  submitAllocation = () => {
    const {
      budgetValue,
      descriptionValue,
      amountValue,
      recipients,
      tokenValue
    } = this.state
    const allocation = {
      budgetId: this.props.budgetId,
      budgetName: budgetValue,
      balance: BigNumber(amountValue).times(BigNumber(10).pow(tokenValue.decimals)).toString(10),
      description: descriptionValue,
      addresses: Object.values(recipients),
    }
    this.props.onSubmitAllocation(allocation)
    this.setState(INITIAL_STATE)
  }

  render() {
    const { balances, budgets } = this.props
    const {
      budgetValue,
      descriptionValue,
      amountValue,
      recipients,
      recipientsValid,
      budgetEmpty,
      descriptionEmpty,
      amountInvalid,
      amountOverBudget,
      amountOverFunds,
      recipientsDuplicate,
      tokenValue,
    } = this.state

    const remainingBudget = displayCurrency(BigNumber(budgetValue.remaining))
    const inVault = displayCurrency(balances.find(b => b.address === tokenValue.address).amount)

    const budgetDropDown = (
      <FormField
        required
        label="Budget"
        input={
          <DropDown
            name="budget"
            items={budgets.map(b => b.name)}
            selected={budgets.indexOf(budgetValue)}
            onChange={i => this.changeField({ target: {
              name: 'budget',
              value: budgets[i],
            } })}
            wide={true}
          />
        }
      />
    )

    const descriptionField = (
      <FormField
        required
        label="Description"
        input={
          <DescriptionInput
            name="description"
            onChange={this.changeField}
            value={descriptionValue}
          />
        }
      />
    )

    const amountField = (
      <FormField
        required
        label="Amount"
        input={
          <div css={`
            display: flex;
            flex-direction: column-reverse;
            align-items: flex-end;
            color: ${theme.textSecondary};
            ${font({ size: 'small' })}
          `}>
            <Text>
              Available in Vault: {inVault} {tokenValue.symbol}
            </Text>
            <Text>
              Available Budget: {remainingBudget} {tokenValue.symbol}
            </Text>
            <InputGroup css={`margin-bottom: ${GU}px; width: 100%`}>
              <TextInput
                name="amount"
                type="number"
                min={MIN_AMOUNT}
                step="any"
                value={amountValue}
                onChange={this.changeField}
                wide={true}
                css={{ borderRadius: '4px 0px 0px 4px' }}
              />
              <CurrencyBox>{tokenValue.symbol}</CurrencyBox>
            </InputGroup>
          </div>
        }
      />
    )

    const userRecipientsField = (
      <FormField
        label="Recipients"
        required
        input={
          <RecipientsInput
            recipients={recipients}
            recipientsValid={recipientsValid}
            onChange={this.changeField}
          />
        }
      />
    )

    const errorBlocks = Object.keys(errorMessages).map((e, i) => (
      <div key={i}>
        <ErrorMessage hasError={this.state[e]} type={e} />
      </div>
    ))

    const areRecipientsInvalid = () => {
      return Object.values(this.state.recipientsValid).includes(false)
    }

    return (
      <div>
        <Form
          onSubmit={this.submitAllocation}
          submitText="Submit"
          disabled={ budgetEmpty || descriptionEmpty || amountInvalid
                     || amountOverBudget || amountOverFunds
                     || areRecipientsInvalid() || recipientsDuplicate }
          errors={errorBlocks}
        >
          {budgetDropDown}
          {descriptionField}
          {amountField}
          {userRecipientsField}
        </Form>
      </div>
    )
  }
}

const ErrorMessage = ({ hasError, type }) => {
  return hasError ? (
    <ErrorText>
      <IconClose
        size="tiny"
        css={{
          marginRight: '8px',
          color: theme.negative,
        }}
      />
      {errorMessages[type]}
    </ErrorText>
  ) : null
}

ErrorMessage.propTypes = {
  hasError: PropTypes.bool,
  type: PropTypes.string,
}

const InputGroup = styled.div`
  display: flex;
`

const ErrorText = styled.div`
  font-size: small;
  display: flex;
  align-items: center;
`

// eslint-disable-next-line import/no-unused-modules
export default NewAllocation
