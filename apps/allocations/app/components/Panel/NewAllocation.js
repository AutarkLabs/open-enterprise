import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import {
  Button,
  Field,
  Text,
  TextInput,
  DropDown,
  theme,
  Info,
} from '@aragon/ui'

import {
  DescriptionInput,
  Form,
  FormField,
  OptionsInput,
  SettingsInput,
  InputDropDown,
} from '../Form'
import { isIntegerString, isStringEmpty } from '../../utils/helpers'

// TODO: Extract to shared
const AVAILABLE_TOKENS = ['ETH', 'ANT', 'GIV', 'FTL', '🦄']
const ALLOCATION_TYPES = ['Informational', 'Token Transfer']
const PAYOUT_TYPES = ['One-Time', 'Monthly']
const INITIAL_STATE = {
  description: '',
  votingTokens: null,
  options: [],
  optionsInput: '',
  allocationType: '',
  allocationTypeIndex: 0,
  activePayoutOption: 0,
  payoutType: '',
  payoutTypeIndex: 0,
  payoutToken: '',
  payoutTokenIndex: 0,
  amount: null,
}

class NewAllocation extends React.Component {
  static propTypes = {
    key: PropTypes.number.isRequired,
    onSubmitAllocation: PropTypes.func.isRequired,
    description: PropTypes.string,
  }

  state = INITIAL_STATE

  // TODO: improve field checking for input errors and sanitize
  changeField = ({ target: { name, value } }) => {
    this.setState({ [name]: value })
  }

  // TODO: Manage dropdown to return a name and value as the rest of inputs
  changeAllocationType = (index, items) => {
    this.setState({ allocationTypeIndex: index, allocationType: items[index] })
  }
  changePayoutToken = (index, items) => {
    this.setState({ payoutTokenIndex: index, payoutToken: items[index] })
  }
  changePayoutType = (index, items) => {
    this.setState({ payoutTypeIndex: index, payoutType: items[index] })
  }

  submitAllocation = () => {
    // clear input here.
    let informational = this.state.allocationTypeIndex == 0
    let recurring = !informational && this.state.payoutTypeIndex != 0
    // TODO: period should be smarter: now the only option is monthly
    let period = recurring ? 86400 * 31 : 0

    let allocation = {
      addresses: this.state.options,
      payoutId: this.props.id,
      information: informational,
      recurring: recurring,
      period: period,
      balance: this.props.limit,
    }

    this.props.onSubmitAllocation(allocation)
    this.setState(INITIAL_STATE)
    console.info('New Allocation: submitting...')
    console.table(this.props)
    console.table(this.state)
  }

  render() {
    return (
      <Form
        // heading={this.props.heading}
        subHeading={this.props.subHeading}
        onSubmit={this.submitAllocation}
        description={this.props.description}
        submitText="Submit Allocation"
      >
        {this.state.allocationTypeIndex == 1 && (
          <Info.Action title="Warning">
            This will create a Range Vote and after it closes, it will result in
            a financial transfer.
          </Info.Action>
        )}
        <FormField
          required
          label="Description"
          input={
            <DescriptionInput
              name="description"
              onChange={this.changeField}
              placeholder="Describe your allocation."
              value={this.state.description}
            />
          }
        />
        <FormField
          required
          separator
          label="Allocation type"
          input={
            <DropDown
              active={this.state.allocationTypeIndex}
              items={ALLOCATION_TYPES}
              name="allocationType"
              onChange={this.changeAllocationType}
            />
          }
        />
        {this.state.allocationTypeIndex == 1 && (
          <FormField
            required
            separator
            label="Amount"
            input={
              <div style={{ display: 'flex', background: 'red' }}>
                <InputDropDown
                  textInput={{
                    name: 'amount',
                    value: this.state.limit,
                    onChange: this.changeField,
                    type: 'number',
                    min: '0',
                  }}
                  dropDown={{
                    name: 'token',
                    items: AVAILABLE_TOKENS,
                    active: this.state.payoutTokenIndex,
                    onChange: this.changePayoutToken,
                  }}
                />
                <RecurringDropDown
                  dropDown={{
                    name: 'payoutType',
                    items: PAYOUT_TYPES,
                    active: this.state.payoutTypeIndex,
                    onChange: this.changePayoutType,
                  }}
                />
              </div>
            }
          />
        )}
        <FormField
          separator
          label="Options"
          input={
            <OptionsInput
              name="options"
              placeholder="Enter an option"
              onChange={this.changeField}
              value={this.state.options}
              input={this.state.optionsInput}
            />
          }
        />
        <FormField
          label="Settings"
          input={
            <SettingsInput
              name="options"
              placeholder="Enter an option"
              onChange={this.changeField}
              value={this.state.settings}
            />
          }
        />
      </Form>
    )
  }
}

const RecurringDropDown = ({ dropDown }) => {
  return (
    <StyledRecurringDropDown>
      <DropDown {...dropDown} />
    </StyledRecurringDropDown>
  )
}

const StyledRecurringDropDown = styled.div`
  margin-left: 17px;
  width: 162px;
`

export default NewAllocation

// TODO: Add Warning message, amount input and date picker input
// FormFields: Warning* , descrription, alloocation type, amount, options
// if allocation type token... show warning y amount
// if freq > one time, show date picker
