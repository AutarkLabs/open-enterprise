import React from 'react'
import styled from 'styled-components'
import { Button, DropDown, TextInput } from '@aragon/ui'

// TODO: Extract to shared
const isIntegerString = value => /^[0-9]*$/.test(value)
const availableTokens = ['ETH', 'ANT', 'GIV', 'FTL', '🦄']
const initialState = {
  address: '0xffffffffffffffffffffffffffffffffffffffff',
  description: '',
  token: availableTokens[0],
  limit: null,
}

class NewAccount extends React.Component {
  state = initialState

  changeField = ({ target: { id, value } }) => {
    this.setState({ [id]: value })
  }

  createAccount = () => {
    this.props.onCreateAccount(this.state)
    this.props.onClose()
    this.setState(initialState)
  }

  render() {
    return (
      <React.Fragment>
        <FieldTitle>
          Description<Required>*</Required>
        </FieldTitle>
        <FieldInput
          onChange={this.changeField}
          rows="2"
          required
          placeholder="Describe your account/project for which you will be creating allocation votes."
          id="description"
          wide
          style={{
            overflow: 'auto',
            resize: 'none',
          }}
          value={this.state.description}
        />
        <FieldTitle>
          Limit<Required>*</Required>
        </FieldTitle>
        <FieldText>
          What sort of limits do you want to set per allocation vote?
        </FieldText>
        <LimitInput
          onChange={this.changeField}
          placeholder="e.g. 20"
          id="limit"
          value={isIntegerString(this.state.limit) ? this.state.limit : ''}
        />
        <DropDown
          items={availableTokens}
          active={availableTokens.indexOf(this.state.token)}
          onChange={token => this.setState({ token: availableTokens[token] })}
        />
        <Button mode="strong" type="submit" wide onClick={this.createAccount}>
          Create Account
        </Button>
      </React.Fragment>
    )
  }
}

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
  margin-bottom: 1rem;
  margin-top: -1px;
  padding-left: 1rem;
  width: 80px;
`

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

const FieldText = styled.p`
  font-size: 12px;
  color: #717171;
`

export default NewAccount
