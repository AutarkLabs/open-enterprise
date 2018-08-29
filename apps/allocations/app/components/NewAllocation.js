import React from 'react'
import styled from 'styled-components'
import {
  Button,
  Field,
  IconAdd,
  Text,
  TextInput,
  DropDown,
  theme,
  Info,
} from '@aragon/ui'

import { IconRemove } from '.'

// TODO: Extract to shared
const isIntegerString = value => /^[0-9]*$/.test(value)
const initialState = {
  description: '',
  votingTokens: null,
  options: ['Mars', 'The Moon'],
  addresses: ['0x1234', '0xDEAD'],
  newOption: '',
  activeAllocationItem: 0,
  allocationTypes: ['Informational', 'Token Transfer'],
  activePayoutOption: 0,
  payoutTypes: ['One-Time', 'Monthly'],
  amount: null,
}

class NewAllocation extends React.Component {
  state = initialState

  changeField = ({ target: { id, value } }) => {
    this.setState({ [id]: value })
  }

  addOption = () => {
    const { options, newOption } = this.state
    newOption &&
      !options.includes(newOption) &&
      this.setState(({ options, newOption }) => ({
        options: [...options, newOption],
        newOption: '',
      }))
  }

  removeOption = option => {
    let index = this.state.options.indexOf(option)
    this.setState(({ options }) => ({
      options: [...options.slice(0, index), ...options.slice(index + 1)],
    }))
  }

  submit = event => {
    console.log('Submit!', this.state, this.props)
    event.preventDefault()
    // this.props.onSetDistribution(
    //   this.state.options,
    //   this.state.addresses,
    //   this.props.payoutId,
    //   this.state.activeAllocationItem,
    //   this.state.activePayoutOption,
    //   this.state.amount
    // )
    this.props.close()
  }

  loadOptions = this.state.options.map(option => (
    <React.Fragment key={option}>
      <TextInput readOnly value={option} />
      <IconRemove onClick={() => this.removeOption(option)} />
    </React.Fragment>
  ))

  render() {
    return (
      // TODO: Fix this `hack`
      <StyledPanel hack={!!this.state.amount}>
        <Text color={theme.textTertiary}>{this.props.accountDescription}</Text>
        {!!this.state.activeAllocationItem && (
          <Info.Action title="Warning">
            This will create a Range Vote and after it closes, it will result in
            a financial transfer.
          </Info.Action>
        )}
        <Field label="Description">
          <FieldInput
            rows="3"
            required
            type="text"
            placeholder="Describe your allocation"
            wide
            id="description"
            value={this.state.description}
            onChange={this.changeField}
          />
        </Field>
        <Field label="Allocation type">
          <DropDown
            required
            items={this.state.allocationTypes}
            active={this.state.activeAllocationItem}
            onChange={activeAllocationItem =>
              this.setState({ activeAllocationItem })
            }
          />
        </Field>
        {!!this.state.activeAllocationItem && (
          <div label="AMOUNT">
            <FieldTitle>
              AMOUNT<Required>*</Required>
            </FieldTitle>
            <LimitInput
              id="amount"
              onChange={this.changeField}
              placeholder="e.g. 20"
              type="limit"
              value={
                isIntegerString(this.state.amount) ? this.state.amount : ''
              }
            />
            <DropDown
              required
              items={this.state.payoutTypes}
              active={this.state.activePayoutOption}
              onChange={activePayoutOption =>
                this.setState({ activePayoutOption })
              }
            />
          </div>
        )}
        <Field label="OPTIONS">
          {this.loadOptions}
          <TextInput
            onChange={this.changeField}
            type="text"
            placeholder="Enter an option"
            id="newOption"
            value={this.state.newOption}
          />
          <IconAdd onClick={this.addOption} />
        </Field>
        <Button mode="strong" type="submit" wide onClick={this.submit}>
          Create Allocation
        </Button>
      </StyledPanel>
    )
  }
}

const FieldTitle = styled.span`
  color: #b3b3b3;
  font-weight: bold;
  text-transform: lowercase;
  font-variant: small-caps;
  color: #b3b3b3;
  display: block;
`

const Required = styled.span`
  margin-left: 0.5rem;
  float: none;
  color: #00cbe6;
`

const MultiLine = TextInput.Multiline
const FieldInput = styled(MultiLine)`
  border-radius: 3px;
  border: 1px solid #e6e6e6;
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
  height: 75px;
  margin-bottom: 1rem;
`

const LimitInput = styled.input`
  border-bottom-right-radius: 0;
  border-radius: 3px;
  border-right: 0;
  border-top-right-radius: 0;
  border: 1px solid #e6e6e6;
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
  height: 40px;
  padding-left: 1rem;
  width: 80px;
`

const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  & > :not(:first-child):not(:last-child) {
    margin-bottom: 1.2rem;
    & span:first-of-type {
      font-weight: bold;
      color: ${theme.textTertiary};
      & span {
        margin-left: 0.5rem;
        float: none;
        color: ${theme.accent};
      }
    }
    & textarea,
    & input {
      ::placeholder {
        color: ${theme.textTertiary};
      }
    }
    & textarea {
      overflow: auto;
      resize: none;
    }
  }
  & > :nth-child(${props => (props.hack ? '7' : '5')}) {
    & input {
      width: calc(100% - 38px);
      margin-bottom: 10px;
    }
    & > :last-child > svg {
      cursor: pointer;
      margin-left: 3px;
      margin-top: -3px;
      height: auto;
      width: 35px;
      color: ${theme.textSecondary};
      vertical-align: middle;
    }
  }
`

export default NewAllocation
