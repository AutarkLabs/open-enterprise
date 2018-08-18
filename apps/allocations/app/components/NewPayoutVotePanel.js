import React, { Component } from '../../../../../../.cache/typescript/2.9/node_modules/@types/react'
import styled from 'styled-components'
import IconRemove from './IconRemove'
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

const { accent, textSecondary, textTertiary } = theme

const isIntegerString = value => /^[0-9]*$/.test(value)

class NewPayoutVotePanel extends Component {
  static defaultProps = {
    onSetDistribution: () => {},
  }

  state = {
    description: '',
    votingTokens: null,
    options: ['Mars', 'The Moon'],
    addresses: ['0x1234', '0xDEAD'],
    optionInputText: '',
    activeAllocationItem: 0,
    allocationTypes: ['Informational', 'Token Transfer'],
    activePayoutOption: 0,
    payoutTypes: ['One-Time', 'Monthly'],
    amount: null,
  }

  handleChange = e => {
    this.setState({ optionInputText: e.target.value })
  }

  handleAddOptionClick = () => {
    const { options, optionInputText } = this.state
    optionInputText &&
      !options.includes(optionInputText) &&
      this.setState(({ options, optionInputText }) => ({
        options: [...options, optionInputText],
        optionInputText: '',
      }))
  }

  handleRemoveOption = option => {
    let index = this.state.options.indexOf(option)
    this.setState(({ options }) => ({
      options: [...options.slice(0, index), ...options.slice(index + 1)],
    }))
  }

  amountChange = e => {
    if (isIntegerString(e.target.value)) {
      this.setState({ amount: e.target.value })
    }
  }

  handleSubmit = event => {
    const { onClose } = this.props
    event.preventDefault()
    this.props.onSetDistribution(
      this.state.options,
      this.state.addresses,
      this.props.payoutId,
      this.state.activeAllocationItem,
      this.state.activePayoutOption,
      this.state.amount
    )
    onClose()
  }


  render() {
    const {
      options,
      optionInputText,
      allocationTypes,
      activeAllocationItem,
      payoutTypes,
      activePayoutOption,
      amount
    } = this.state
    const optionsElements = options.map(option => (
      <React.Fragment key={option}>
        <TextInput readOnly value={option} />
        <IconRemove onClick={() => this.handleRemoveOption(option)} />
      </React.Fragment>
    ))

    return (
      <StyledPanel hack={!!activeAllocationItem}>
        <Text size="xxlarge">New Allocation</Text>
        <Text color={textTertiary}>Title of Account</Text>
        {!!activeAllocationItem && (
          <Info.Action title="Warning">
            This will create a Range Vote and after it closes, it will result in
            a financial transfer.
          </Info.Action>
        )}
        <Field label="Description">
          <TextInput.Multiline
            rows="3"
            required
            type="text"
            placeholder="Describe your vote"
            wide
          />
        </Field>
        <Field label="Allocation type">
          <DropDown
            required
            items={allocationTypes}
            active={activeAllocationItem}
            onChange={activeAllocationItem =>
              this.setState({ activeAllocationItem })
            }
          />
        </Field>
        {!!activeAllocationItem && (
          <div label="AMOUNT">
            <FieldTitle>
              AMOUNT
              <Required>*</Required>
            </FieldTitle>
            <LimitInput
              onChange={this.amountChange}
              placeholder="e.g. 20"
              type="limit"
              value={isIntegerString(amount) ? amount : ''}
            />
            <DropDown
              required
              items={payoutTypes}
              active={activePayoutOption}
              onChange={activePayoutOption =>
                this.setState({ activePayoutOption })
              }
            />
          </div>
        )}
        <Field label="OPTIONS">
          {optionsElements}
          <TextInput
            onChange={this.handleChange}
            type="text"
            placeholder="Enter an option"
            value={optionInputText}
          />
          <IconAdd onClick={this.handleAddOptionClick} />
        </Field>
        <Button mode="strong" type="submit" wide onClick={this.handleSubmit}>
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

const FieldInput = styled.input`
  height: 40px;
  border: 1px solid #e6e6e6;
  border-radius: 3px;
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
  padding-left: 1rem;
`

const LimitInput = FieldInput.extend`
  border-right: 0;
  width: 80px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
`

const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  & > :not(:first-child):not(:last-child) {
    margin-bottom: 1.2rem;
    & span:first-of-type {
      font-weight: bold;
      color: ${textTertiary};
      & span {
        margin-left: 0.5rem;
        float: none;
        color: ${accent};
      }
    }
    & textarea,
    & input {
      ::placeholder {
        color: ${textTertiary};
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
      color: ${textSecondary};
      vertical-align: middle;
    }
  }
`

export default NewPayoutVotePanel
