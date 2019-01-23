import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { BigNumber } from 'bignumber.js'

import {
  Button,
  Field,
  Text,
  TextInput,
  DropDown,
  theme,
  Info,
  Checkbox,
} from '@aragon/ui'

import {
  DescriptionInput,
  Form,
  FormField,
  OptionsInput,
  OptionsInputDropdown,
  SettingsInput,
  InputDropDown,
} from '../Form'

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
  allocationError: false,
  balanceSetting: false,
  addressSetting: false,
}

class NewAllocation extends React.Component {
  static propTypes = {
    // key: PropTypes.number.isRequired, // TODO: Check the use of this required prop
    onSubmitAllocation: PropTypes.func.isRequired,
    description: PropTypes.string,
    entities: PropTypes.object,
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

  // Should be using web3.isAddress probably but this is good enough for now
  isAddressError = (entities, addr) => {
    console.log("address")
    console.log(entities)
    console.log(addr)
    let entitiesAddrs = entities.map(entity => entity.addr)
    if (!/^(0x)?[0-9a-f]{40}$/i.test(addr) || entitiesAddrs.includes(addr)) {
      this.state.addressError = true
      return false
    }
    this.state.addressError = false
    return true
  }

  submitAllocation = () => {
    // clear input here.

    let informational = this.state.allocationTypeIndex === 0
    let recurring = !informational && this.state.payoutTypeIndex != 0
    // TODO: period should be smarter: now the only option is monthly
    let period = recurring ? 86400 * 31 : 0
    let optionsInput = this.state.optionsInput.addr
    this.setState({
      addressError: this.state.addressError,
      allocationError: false,
    })
    if (!(this.isAddressError(this.state.options, optionsInput) || optionsInput === '')) {
      this.setState({ addressError: true })
    } else {
      this.state.options.push(this.state.optionsInput)
    }
    let allocation = {
      addresses: this.state.options.map(option => option.addr),
      payoutId: this.props.id,
      informational: informational,
      recurring: recurring,
      period: period,
      balance: this.state.amount * 10e17,
    }
    if (allocation.balance > this.props.limit && !informational) {
      this.setState({ allocationError: true })
      return
    }
    this.props.onSubmitAllocation(allocation)
    this.state.allocationError = false
    this.setState(INITIAL_STATE)
    console.info('New Allocation: submitting...')
    console.table(this.props)
    console.table(this.state)
  }

  render() {
    return (
      <div>
        <Form
          // heading={this.props.heading}
          subHeading={this.props.subHeading}
          onSubmit={this.submitAllocation}
          description={this.props.description}
          submitText="Submit Allocation"
        >
          {this.state.allocationTypeIndex == 1 && (
            <Info.Action title="Warning">
              This will create a Range Vote and after it closes, it will result
              in a financial transfer.
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
          <FormField
            label="Settings"
            input={
              <div>
                <SettingsInput
                  name="balanceSetting"
                  text="Must vote with entire balance"
                  onChange={this.changeField}
                />
                {this.props.entities.length > 0 && (
                  <SettingsInput
                    name="addressSetting"
                    text="Use address book for options"
                    onChange={this.changeField}
                  />
                )}
              </div>
            }
          />
          {this.state.allocationTypeIndex == 1 && (
            <FormField
              required
              separator
              label="Amount"
              input={
                <div style={{ display: 'flex', width: '375px' }}>
                  <InputDropDown
                    wide
                    textInput={{
                      name: 'amount',
                      value: this.state.amount,
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
          {this.state.addressSetting == true && (
            <FormField
              separator
              label={this.state.addressSetting}
              input={
                <OptionsInputDropdown
                  name="options"
                  placeholder="Enter an option"
                  onChange={this.changeField}
                  value={this.state.options}
                  input={this.state.optionsInput}
                  validator={this.isAddressError}
                  error={this.state.addressError}
                  entities={this.props.entities}
                />
              }
            />
          )}
          {this.state.addressSetting == false && (
            <FormField
              separator
              label={this.state.addressSetting}
              input={
                <OptionsInput
                  name="options"
                  placeholder="Enter an option"
                  onChange={this.changeField}
                  value={this.state.options}
                  input={this.state.optionsInput}
                  validator={this.isAddressError}
                  error={this.state.addressError}
                />
              }
            />
          )}
        </Form>
        <div>
          {this.state.allocationError && (
            <Info title="Error">Amount must be less than limit.</Info>
          )}
          {this.state.addressError && (
            <Info title="Error">
              All options must be addresses and cannot be duplicates.
            </Info>
          )}
        </div>
      </div>
    )
  }
}

const RecurringDropDown = ({ dropDown }) => {
  return (
    <StyledRecurringDropDown>
      <DropDown {...dropDown} wide />
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
