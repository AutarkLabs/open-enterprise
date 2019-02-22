import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { DropDown, Info } from '@aragon/ui'

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
  allocationType: '',
  allocationTypeIndex: 1,
  activePayoutOption: 0,
  payoutType: '',
  payoutTypeIndex: 0,
  payoutToken: '',
  payoutTokenIndex: 0,
  amount: null,
  allocationError: false,
  balanceSetting: false,
  addressSetting: false,
  options: [],
  optionsInput: { addr: 0, index: 0 },
  optionsString: [],
  optionsInputString: { addr: '' },
}

class NewAllocation extends React.Component {
  static propTypes = {
    onSubmitAllocation: PropTypes.func.isRequired,
    description: PropTypes.string,
    entities: PropTypes.array, // TODO: Better shape the array
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

  isAddressError = (entities, addr) => {
    const isAddress = /^(0x)?[0-9a-f]{40}$/i.test(addr) // TODO: replace by: web3.isAddress(addr)
    console.log('[isAddressError] entitites', entities, 'addr', addr)
    const isDuplicated =
      entities.length > 1 && entities.map(entity => entity.addr).includes(addr)
    const isEmpty = !addr || addr.length === 0 || addr === 0x0
    const errorCondition = !isAddress || isDuplicated || isEmpty
    return errorCondition
  }

  submitAllocation = () => {
    let informational = this.state.allocationTypeIndex === 0
    let recurring = this.state.payoutTypeIndex !== 0
    let options = this.state.addressSetting
      ? this.state.options
      : this.state.optionsString

    // define the allocation object
    let allocation = {
      payoutId: this.props.id,
      informational: informational,
      recurring: recurring,
      period: recurring ? 86400 * 31 : 0,
      balance: this.state.amount * 10e17,
    }

    // check for correct balance if token transfer type
    if (!informational) {
      if (allocation.balance > this.props.limit) {
        this.setState({ allocationError: true })
        return
      }
    }

    // If everything is ok (no validation errors) add options to allocation.addresses
    allocation.addresses = options.map(option => option.addr)

    // check options are addresses TODO: fix contract to accept regular strings (informational vote)
    let optionsInput = this.state.optionsInput.addr
    if (
      optionsInput !== 0 &&
      this.isAddressError(this.state.options, optionsInput)
    ) {
      this.setState({ addressError: true })
      return
    } else if (optionsInput !== 0) {
      allocation.addresses.push(optionsInput)
    }

    // submit the allocation (invoke contract function)
    this.props.onSubmitAllocation(allocation)

    // reset everything here
    this.setState(INITIAL_STATE)
  }

  render() {
    return (
      <div>
        <Form
          subHeading={this.props.subHeading}
          onSubmit={this.submitAllocation}
          description={this.props.description}
          submitText="Submit Allocation"
        >
          {this.state.allocationTypeIndex === 1 && (
            <Info.Action title="Warning">
              This will create a Range Vote and after it closes, it will result
              in a financial transfer.
            </Info.Action>
          )}
          {false && (
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
          )}
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
                {// temporarily check > 1 because the first is "Select an entry msg"
                  this.props.entities.length > 1 && (
                    <SettingsInput
                      name="addressSetting"
                      text="Use address book for options"
                      onChange={this.changeField}
                    />
                  )}
              </div>
            }
          />
          {this.state.allocationTypeIndex === 1 && (
            <FormField
              required
              separator
              label="Amount"
              // TODO: We should back to width: '375px' when RecurringDropDown is used again
              input={
                <div style={{ display: 'flex', width: '220px' }}>
                  <InputDropDown
                    wide
                    textInput={{
                      name: 'amount',
                      value: this.state.amount || '',
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
                  {/* // Not currently implemented: */}
                  {/* <RecurringDropDown
                    dropDown={{
                      name: 'payoutType',
                      items: PAYOUT_TYPES,
                      active: this.state.payoutTypeIndex,
                      onChange: this.changePayoutType,
                    }}
                  /> */}
                </div>
              }
            />
          )}
          {this.state.addressSetting === true && (
            <FormField
              separator
              // label={this.state.addressSetting} // TODO: Label MUST be string here boolean is passed
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
                  activeItem={this.state.optionsInput.index}
                />
              }
            />
          )}
          {this.state.addressSetting === false && (
            <FormField
              separator
              // label={this.state.addressSetting} // TODO: a string MUST be passed instead of this current boolean
              input={
                <OptionsInput
                  name="optionsString"
                  placeholder="Enter an option"
                  onChange={this.changeField}
                  value={this.state.optionsString}
                  input={this.state.optionsInputString}
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
