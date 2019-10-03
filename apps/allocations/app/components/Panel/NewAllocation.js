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
  recipientsCurrent: '',
  recipientsAll: [],
  recipientsEmpty: true,
  recipientsInvalid: false,
  recipientsNotUnique: false,
}

const errorMessages = {
  amountOverBudget: 'Amount must be smaller than available budget',
  amountOverFunds: 'Amount must be smaller than underlying funds',
  recipientsNotUnique: 'Recipients must be unique',
}

const isRecipientValid = (current) => {
  if (current === '') return true
  return web3Utils.isAddress(current)
}

const isRecipientUnique = (current, all) => {
  if (current === '') return true
  const isUnique = !all.length || !all.includes(current)
  return isUnique
}

const isRecipientEmpty = (current) => {
  const empty = current.length === 0 || current === '0x0'
  return empty
}

class NewAllocation extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    onSubmitAllocation: PropTypes.func.isRequired,
    budgetList: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectedBudget: PropTypes.number,
    budgetLimit: PropTypes.string.isRequired,
    fundsLimit: PropTypes.string.isRequired,
    description: PropTypes.string,
    currency: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = INITIAL_STATE
    if (props.selectedBudget >= 0) {
      this.state.budgetValue = props.selectedBudget
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
    const { recipientsAll } = this.state

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
      this.setState({
        recipientsCurrent: value,
        recipientsInvalid: !isRecipientValid(value),
        recipientsNotUnique: !isRecipientUnique(value, recipientsAll),
        recipientsEmpty: isRecipientEmpty(value),
      })
    }

    else if (name === 'recipientsAdd') {
      this.setState({
        recipientsCurrent: '',
        recipientsAll: value,
        recipientsInvalid: false,
        recipientsNotUnique: false,
        recipientsEmpty: true,
      })
    }

    else if (name === 'recipientsRemove') {
      this.setState({
        recipientsAll: value,
      })
    }

    else if (name === 'recipientsRemoveCurrent') {
      if (recipientsAll.length > 0) {
        const last = recipientsAll.length - 1
        this.setState({
          recipientsCurrent: recipientsAll[last],
          recipientsAll: recipientsAll.slice(0, last),
          recipientsInvalid: false,
          recipientsNotUnique: false,
          recipientsEmpty: false,
        })
      }
      else {
        this.setState({
          recipientsCurrent: '',
          recipientsInvalid: false,
          recipientsNotUnique: false,
          recipientsEmpty: true,
        })
      }
    }
  }

  submitAllocation = () => {
    const {
      budgetValue,
      descriptionValue,
      amountValue,
      recipientsCurrent,
      recipientsAll
    } = this.state
    const recipients = this.state.recipientsEmpty ? recipientsAll
      : [ ...recipientsAll, recipientsCurrent ]
    const allocation = {
      payoutId: this.props.id,
      budgetName: budgetValue,
      balance: amountValue * 10e17,
      description: descriptionValue,
      addresses: recipients
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
            items={props.budgetList}
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
              <CurrencyBox>{props.currency}</CurrencyBox>
            </InputGroup>
            <InputGroup css={{ justifyContent: 'right' }}>
              <Text
                size="small"
                css={{ paddingTop: '10px' }}>
                Available Budget: {props.budgetLimit} {props.currency}
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
            name="recipients"
            current={state.recipientsCurrent}
            all={state.recipientsAll}
            onChange={this.changeField}
            placeholder="Type here…"
            valid={!state.recipientsInvalid && state.recipientsCurrent !== ''
                   && !state.recipientsNotUnique}
            empty={state.recipientsEmpty}
          />
        }
      />
    )

    const errorBlocks = Object.keys(errorMessages).map((e, i) => (
      <div key={i}>
        <ErrorMessage hasError={state[e]} type={e} />
      </div>
    ))

    return (
      <div>
        <Form
          onSubmit={this.submitAllocation}
          description={props.description}
          submitText="Submit"
          disabled={state.budgetEmpty || state.descriptionEmpty
                    || state.amountInvalid || state.amountOverBudget
                    || state.amountOverFunds || state.recipientsInvalid
                    || (state.recipientsAll.length === 0
                        && state.recipientsEmpty) }
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
  border: 1px solid #DDE4E9;
  border-left-style: none;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 8px 14px 7px;
  font-weight: normal;
  border-radius: 0px 4px 4px 0px;
`

const ErrorText = styled.div`
  font-size: small;
  display: flex;
  align-items: center;
`

// eslint-disable-next-line import/no-unused-modules
export default NewAllocation
