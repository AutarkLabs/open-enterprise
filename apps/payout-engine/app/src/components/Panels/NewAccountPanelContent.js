import React, { Component } from 'react'
import styled from 'styled-components'
import IconRemove from '../Icons/Remove'
import {
    Button,
    Field,
    IconAdd,
    Text,
    TextInput,
    theme,
    DropDown
} from '@aragon/ui'

const { accent, textSecondary, textTertiary } = theme

const isIntegerString = (value) => /^[0-9]*$/.test(value)

class NewAccountPanel extends Component {
  state = {
    activeItem: 0,
    title: '',
    limit: null,
  }

  handleLimitChange = (index) => {
    this.setState({ activeItem: index })
  }

  titleChange = (e) => {
      this.setState({ title: e.target.value })
  }

  limitChange = (e) => {
    if (isIntegerString(e.target.value)) {
      this.setState({ limit: e.target.value })
    }
  }
    render() {
        const {
            title,
            limit,
        } = this.state

      return (
          <div>
            <Text size="xxlarge">New Account</Text>
            <FieldTitle>Title<Required>*</Required></FieldTitle>
            <FieldInput
              onChange={this.titleChange}
              placeholder="Enter title"
              type="title"
              value={title}
            />
            <FieldTitle>Limit<Required>*</Required></FieldTitle>
            <FieldText>What sort of limits do you want to set per allocation vote?</FieldText>
            <LimitInput
              onChange={this.limitChange}
              placeholder="e.g. 20"
              type="limit"
              value={isIntegerString(limit) ? limit : ''}
            />
            <DropDown items={['ETH', 'ARA', 'GIV']} active={this.state.activeItem} onChange={this.handleLimitChange} />
            <Button mode="strong" type="submit" wide >
              Create Account
            </Button>
          </div>
      )
  }
}

const FieldInput = styled.input`
  height: 40px;
  border: 1px solid #E6E6E6;
  border-radius: 3px;
  box-shadow: 0 4px 4px 0 rgba(0,0,0,0.03);
  padding-left: 1rem;
  margin-bottom: 1rem;
`

const LimitInput = FieldInput.extend`
  border-right: 0;
  width: 80px;
  margin-top: -1px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
`

const FieldTitle = styled.span`
  color: #B3B3B3;
  font-weight: bold;
  text-transform: lowercase;
  font-variant: small-caps;
  color: #B3B3B3;
  display: block;
`

const Required = styled.span`
  margin-left: .5rem;
  float: none;
  color: #00CBE6;
`

const FieldText = styled.p`
  font-size: 12px;
  color: #717171;
`

export default NewAccountPanel
