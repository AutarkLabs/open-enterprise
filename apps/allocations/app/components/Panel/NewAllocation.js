import PropTypes from 'prop-types'
import React from 'react'
import { DropDown, Info } from '@aragon/ui'
import web3Utils from 'web3-utils'
import { OptionsInput, SettingsInput } from '../../../../../shared/ui'

import {
  AddressDropDownOptions,
  DescriptionInput,
  Form,
  FormField,
  InputDropDown,
} from '../Form'

// TODO: Extract to shared
const ALLOCATION_TYPES = [ 'Informational', 'Token Transfer' ]
// const PAYOUT_TYPES = ['One-Time', 'Monthly']
const INITIAL_STATE = {
  activePayoutOption: 0,
  addressBookCandidates: [],
  // TODO: Merge with userInput
  addressBookInput: { addr: 0, index: 0 },
  addressError: false,
  addressSetting: false,
  allocationDescription: '',
  allocationError: false,
  allocationType: '',
  allocationTypeIndex: 1,
  amount: null,
  payoutToken: '',
  payoutTokenIndex: 0,
  payoutType: '',
  payoutTypeIndex: 0,
  userInput: { addr: '' },
  userInputCandidates: [],
  votingTokens: null,
}

const message = {
  addressError: 'All options must be addresses and cannot be duplicates.',
  descriptionError: 'A description of the allocation is required.',
  allocationError: 'Amount must be set.',
  addressSetting: 'Use address book for options',
  transferWarning:
    'This will create a Range Vote and after it closes, it will result in a financial transfer.',
}

const uniqueAddressValidation = (entries, addr) => {
  const isAddress = web3Utils.isAddress(addr)
  const isUnique = !entries.length || !entries.map(e => e.addr).includes(addr)
  const notEmpty = addr && !!addr.length && addr !== '0x0'
  const validated = isAddress && isUnique && notEmpty
  return validated // approved if not errorCondition
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
    // reset error to false if changing related field
    const resetAddressError = [
      'addressBookInput',
      'addressBookCandidates',
      'addressSetting',
      'userInput',
      'userInputCandidates',
    ].includes(name)
    const resetAllocationsError = name === 'amount'
    const resetDescriptionError = name === 'allocationDescription'

    // react chains the state changes asynchronously
    resetAddressError && this.setState({ addressError: false })
    resetAllocationsError && this.setState({ allocationError: false })
    resetDescriptionError && this.setState({ descriptionError: false })

    this.setState({ [name]: value })
  }

  // TODO: Manage dropdown to return a name and value as the rest of inputs

  changePayoutToken = (index, items) => {
    this.setState({
      allocationError: false,
      payoutTokenIndex: index,
      payoutToken: items[index],
      tokenAddress: this.props.balances[index].address
    })
  }

  // TODO: fix contract to accept regular strings(informational vote)
  submitAllocation = () => {
    const { props, state } = this
    const informational = state.allocationTypeIndex === 0
    const recurring = state.payoutTypeIndex !== 0
    const candidates = state.addressSetting
      ? state.addressBookCandidates
      : state.userInputCandidates
    const allocation = {
      payoutId: this.props.id,
      informational: informational,
      recurring: recurring,
      period: recurring ? 86400 * 31 : 0,
      balance: this.state.amount * 10e17,
      description: this.state.allocationDescription,
      tokenAddress: this.state.tokenAddress,
    }

    if (state.addressError || state.allocationError || state.descriptionError) {
      return
    }
    if (!informational && allocation.balance === 0) {
      this.setState({ allocationError: true })
      return
    }
    if(allocation.description === ''){
      this.setState({ descriptionError: true })
      return
    }
    if (!candidates.length) {
      this.setState({ addressError: true })
      return
    }

    // If everything is ok (no validation error) add candidates to allocation.addresses
    allocation.addresses = candidates.map(c => c.addr)
    props.onSubmitAllocation(allocation)
    this.setState(INITIAL_STATE)
  }

  render() {
    const { props, state } = this
    const transferEnabled = state.allocationTypeIndex === 1

    let availableTokens =  this.props.balances.map( balance => balance.symbol)

    const amountInput = {
      name: 'amount',
      value: state.amount || '',
      onChange: this.changeField,
      type: 'number',
      min: '0',
    }

    const amountDropDown = {
      name: 'token',
      items: availableTokens,
      active: state.payoutTokenIndex,
      onChange: this.changePayoutToken,
    }

    const warningMessages = (
      <WarningMessage hasWarning={transferEnabled} type={'transferWarning'} />
    )

    const errorMessages = [ 'allocationError', 'addressError', 'descriptionError' ].map((e, i) => (
      <ErrorMessage key={i} hasError={state[e]} type={e} />
    ))

    const descriptionField = (
      <FormField
        visible={true}
        required
        label="Description"
        input={
          <DescriptionInput
            name="allocationDescription"
            onChange={this.changeField}
            placeholder="Describe your allocation."
            value={state.allocationDescription}
          />
        }
      />
    )

    const settingsInputs = [
      { name: 'addressSetting', visible: props.entities.length > 1 },
    ].map((s, i) => (
      <SettingsInput
        key={i}
        onChange={this.changeField}
        text={message[s.name]}
        value={state[s.name]}
        {...s}
      />
    ))

    const settingsField = props.entities.length > 1 && (
      <FormField
        label="Settings"
        input={<React.Fragment children={settingsInputs} />}
      />
    )

    const amountField = (
      <FormField
        visible={transferEnabled}
        required
        separator
        label="Amount"
        // TODO: We should back to width: '375px' when RecurringDropDown is used again
        input={
          <div style={{ display: 'flex', width: '220px' }}>
            <InputDropDown
              wide
              textInput={amountInput}
              dropDown={amountDropDown}
            />
            {/* // Not currently implemented: */}
            {/* <RecurringDropDown
            dropDown={{
              name: 'payoutType',
              items: PAYOUT_TYPES,
              active: this.payoutTypeIndex,
              onChange: this.changePayoutType,
            }}
          /> */}
          </div>
        }
      />
    )

    const activeAddressBookItem = this.state.addressBookInput.index

    const addressBookField = (
      <FormField
        label="Address Book Options"
        required
        visible={state.addressSetting}
        separator
        input={
          <AddressDropDownOptions
            activeItem={activeAddressBookItem}
            entities={props.entities}
            input={state.addressBookInput}
            name="addressBookCandidates"
            onChange={this.changeField}
            validator={uniqueAddressValidation}
            values={state.addressBookCandidates}
          />
        }
      />
    )

    console.log('addressbook field:', activeAddressBookItem)

    const userOptionsField = (
      <FormField
        label="Options"
        required
        visible={!state.addressSetting}
        separator
        input={
          <OptionsInput
            error={state.addressError}
            input={state.userInput}
            name="userInputCandidates"
            onChange={this.changeField}
            placeholder="Enter an address option"
            validator={uniqueAddressValidation}
            values={state.userInputCandidates}
          />
        }
      />
    )

    return (
      <div>
        <Form
          subHeading={props.subHeading}
          onSubmit={this.submitAllocation}
          description={props.description}
          submitText="Submit Allocation"
        >
          {warningMessages}
          {descriptionField}
          {settingsField}
          {amountField}
          {addressBookField}
          {userOptionsField}
          {errorMessages}
        </Form>
      </div>
    )
  }
}

const ErrorMessage = ({ hasError, type }) =>
  hasError ? (
    <Info.Action
      background="#fb79790f"
      title="Error"
      children={message[type]}
      style={{ margin: '20px 0' }}
    />
  ) : null

ErrorMessage.propTypes = {
  hasError: PropTypes.bool,
  type: PropTypes.string,
}

const WarningMessage = ({ hasWarning, type }) =>
  hasWarning ? <Info.Action title="Warning" children={message[type]} style={{ marginBottom: '10px' }} /> : null

// TODO: unused
// const RecurringDropDown = ({ dropDown }) => {
//   return (
//     <StyledRecurringDropDown>
//       <DropDown {...dropDown} wide />
//     </StyledRecurringDropDown>
//   )
// }
// const StyledRecurringDropDown = styled.div`
//   margin-left: 17px;
//   width: 162px;
// `

export default NewAllocation
