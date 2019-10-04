import PropTypes from 'prop-types'
import React from 'react'
import { DropDown, IconClose, Text, TextInput, theme } from '@aragon/ui'
import web3Utils from 'web3-utils'
import styled from 'styled-components'

import { RecipientsInput } from '../../../../../shared/ui'
import { BigNumber } from 'bignumber.js'
import { MIN_AMOUNT } from '../../utils/constants'
import { isStringEmpty } from '../../utils/helpers'
import { DescriptionInput, Form, FormField } from '../Form'

const INITIAL_STATE = {
  budgetValue: -1,
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
}

const errorMessages = {
  amountOverBudget: 'Amount must be smaller than available budget',
  amountOverFunds: 'Amount must be smaller than underlying funds',
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
    token: PropTypes.object.isRequired,
    budgetLimit: PropTypes.string.isRequired,
    fundsLimit: PropTypes.string.isRequired,
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
    if (budgetId >= 0) {
      this.state.budgetValue = budgets.indexOf(
        budgets.find(b => b.id === budgetId)
      )
      this.state.budgetEmpty = false
    }
  }

  changeField = e => {
    if (e.target === undefined) {
      this.setState({
        budgetValue: e,
        budgetEmpty: e === -1
      })
      return
    }
    const { name, value } = e.target
    const { budgetLimit, fundsLimit } = this.props
    const { recipients, recipientsValid } = this.state

    if (name === 'description') {
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
        amountOverBudget: BigNumber(value).gt(budgetLimit),
        amountOverFunds: BigNumber(value).gt(fundsLimit),
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
      recipients
    } = this.state
    const allocation = {
      payoutId: this.props.budgetId,
      budgetName: budgetValue,
      balance: amountValue * 10e17,
      description: descriptionValue,
      addresses: Object.values(recipients),
    }
    this.props.onSubmitAllocation(allocation)
    this.setState(INITIAL_STATE)
  }

  render() {
    const { props, state } = this

    const budgetDropDown = (
      <FormField
        required
        label="Budget"
        input={
          <DropDown
            name="budget"
            items={props.budgets.map(b => b.name)}
            selected={state.budgetValue}
            onChange={this.changeField}
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
            value={state.descriptionValue}
          />
        }
      />
    )

    const amountField = (
      <FormField
        required
        label="Amount"
        input={
          <React.Fragment>
            <InputGroup>
              <TextInput
                name="amount"
                type="number"
                min={MIN_AMOUNT}
                step="any"
                value={state.amountValue}
                onChange={this.changeField}
                wide={true}
                css={{ borderRadius: '4px 0px 0px 4px' }}
              />
              <CurrencyBox>{props.token.symbol}</CurrencyBox>
            </InputGroup>
            <InputGroup css={{ justifyContent: 'flex-end' }}>
              <Text
                size="small"
                css={{ paddingTop: '10px', color: theme.contentSecondary }}>
                Available Budget: {props.budgetLimit} {props.token.symbol}
              </Text>
            </InputGroup>
          </React.Fragment>
        }
      />
    )

    const userRecipientsField = (
      <FormField
        label="Recipients"
        required
        input={
          <RecipientsInput
            recipients={state.recipients}
            recipientsValid={state.recipientsValid}
            onChange={this.changeField}
            valid={!state.recipientsInvalid}
          />
        }
      />
    )

    const errorBlocks = Object.keys(errorMessages).map((e, i) => (
      <div key={i}>
        <ErrorMessage hasError={state[e]} type={e} />
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
          disabled={ state.budgetEmpty || state.descriptionEmpty
                     || state.amountInvalid || state.amountOverBudget
                     || state.amountOverFunds || areRecipientsInvalid()
                     || state.recipientsDuplicate }
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

const CurrencyBox = styled.div`
  border: 1px solid #dde4e9;
  border-left-style: none;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 8px 14px 7px;
  font-weight: normal;
  border-radius: 0 4px 4px 0;
`

const ErrorText = styled.div`
  font-size: small;
  display: flex;
  align-items: center;
`

// eslint-disable-next-line import/no-unused-modules
export default NewAllocation
