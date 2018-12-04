import React from 'react'
import styled from 'styled-components'
// import { theme, Field, TextInput, Button, Info } from '@aragon/ui'
import { Button, Text, Field, TextInput, theme } from '@aragon/ui'
import NumberFormat from 'react-number-format'

import { DropDown } from '../Shared'

class Settings extends React.Component {
  render() {
    return (
      <StyledContent>
        <div className="column">
          <ExperienceLevel />
          <BaseRate />
        </div>
        <div className="column">
          <BountyContractAddress />
          <BountyCurrency />
          <BountyArbiter />
          <BountyDeadline />
        </div>
      </StyledContent>
    )
  }
}

const bountyDeadlines = ['Weeks', 'Days', 'Hours']

// TODO: Inset shadow for DropDown? (as in address book entity type)
const StyledInputDropDown = styled.div`
  display: inline-flex;
  position: relative;
  justify-content: center;
  > :first-child {
    height: 40px;
    width: 75px;
    z-index: 2;
  }
  > :last-child {
    left: -11px;
    width: 130px;
    z-index: 1;
  }
`

const BountyDeadline = () => (
  <div>
    <Text.Block size="large" weight="bold">
      BountyDeadline
    </Text.Block>
    <Text.Block>
      The default amount of time contributors have to submit work once a bounty
      is activated.
    </Text.Block>
    <StyledInputDropDown>
      <NumberFormat
        customInput={StyledNumberInput}
        fixedDecimalScale
        decimalScale={0}
        value={4}
        allowNegative={false}
      />
      <DropDown items={bountyDeadlines} />
    </StyledInputDropDown>
  </div>
)

const BountyArbiter = () => (
  <div>
    <Text.Block size="large" weight="bold">
      Bounty Arbiter
    </Text.Block>
    <Text.Block>The entity responsible for dispute resolution.</Text.Block>
    <TextInput
      readOnly
      style={{
        width: '375px',
        height: '40px',
        fontSize: '15px',
        textAlign: 'left',
        marginRight: '10px',
      }}
      value="N/A"
    />
    {/* // TODO: not vertical aligned with the input field */}
    <Button.Anchor
      mode="outline"
      style={{ height: '40px' }}
      href="https://etherscan.io/address/0x281055afc982d96fab65b3a49cac8b878184cb16"
      target="_blank"
    >
      See on Etherscan
    </Button.Anchor>
  </div>
)

const bountyCurrencies = ['FTL', 'ANT', '🦄']

const BountyCurrency = () => (
  <div>
    <Text.Block size="large" weight="bold">
      Bounty Currency
    </Text.Block>
    <Text.Block>The default currency used when allocating bounties.</Text.Block>
    <Field label="Select currency">
      <StyledInputDropDown style={{ paddingLeft: '11px' }}>
        <DropDown items={bountyCurrencies} />
      </StyledInputDropDown>
    </Field>
  </div>
)

const BountyContractAddress = () => (
  <div>
    <Text.Block size="large" weight="bold">
      Bounty Contract Address
    </Text.Block>
    <Text.Block>
      This is the smart contract that is actually allocating bounties.
    </Text.Block>
    <TextInput
      readOnly
      style={{
        width: '375px',
        height: '40px',
        fontSize: '15px',
        textAlign: 'center',
        marginRight: '10px',
      }}
      value="0x2af47a65da8cd66729b4209c22017d6a5c2d2400"
    />
    {/* // TODO: not vertical aligned with the input field */}
    <Button.Anchor
      mode="outline"
      style={{ height: '40px' }}
      href="https://etherscan.io/address/0x281055afc982d96fab65b3a49cac8b878184cb16"
      target="_blank"
    >
      See on Etherscan
    </Button.Anchor>
  </div>
)

const BaseRate = () => (
  <div>
    <Text.Block size="large" weight="bold">
      Base Rate
    </Text.Block>
    <Text.Block>
      Define your organization’s hourly rate. This is multiplied by the bounty
      size and converted into the bounty currency under the hood.
    </Text.Block>
    <Field label="RATE PER HOUR">
      <NumberFormat
        customInput={StyledNumberInput}
        fixedDecimalScale
        decimalScale={2}
        value={30}
        allowNegative={false}
      />
      <Text>USD</Text>
    </Field>
  </div>
)

const ExperienceLevel = () => (
  <div>
    <Text.Block size="large" weight="bold">
      Experience Level
    </Text.Block>
    <Text.Block>Define the experience level multipliers.</Text.Block>
    <Field label="LEVEL 1">
      <NumberFormat
        customInput={StyledNumberInput}
        fixedDecimalScale
        decimalScale={2}
        value={1}
        allowNegative={false}
      />
      <StyledTextInput defaultValue="Beginner" />
    </Field>
    <Field label="LEVEL 2">
      <NumberFormat
        customInput={StyledNumberInput}
        fixedDecimalScale
        decimalScale={2}
        value={3}
        allowNegative={false}
      />
      <StyledTextInput defaultValue="Intermediate" />
    </Field>
    <Field label="LEVEL 3">
      <NumberFormat
        customInput={StyledNumberInput}
        fixedDecimalScale
        decimalScale={2}
        value={5}
        allowNegative={false}
      />
      <StyledTextInput defaultValue="Advanced" />
    </Field>
    <StyledButton compact mode="secondary">
      + Add Another
    </StyledButton>
  </div>
)

// const StyledNumberInput = styled(TextInput)`
//   height: 40px;
//   /* // width: ${props => (props.type === 'number' ? '131' : '185')}px; */
//   width: 131px;
//   margin-right: 10px;
//   text-align: right;
//   /* // -moz-appearance: textfield; */
//   font-size: 16px;
// `
const StyledNumberInput = styled(TextInput)`
  height: 40px;
  width: 131px;
  margin-right: 10px;
  text-align: right;
  font-size: 16px;
`
// https://stackoverflow.com/questions/3790935/can-i-hide-the-html5-number-input-s-spin-box

// TODO: Refactor styles
const StyledTextInput = styled(TextInput).attrs({
  type: 'text',
})`
  height: 40px;
  width: 185px;
  font-size: 16px;
`

const StyledButton = styled(Button)`
  font-size: 15px;
  margin-top: 10px;
`
// padding-left: 30px;
// background: url(${cross}) no-repeat 10px calc(50% - 1px);

const StyledContent = styled.div`
  padding: 30px;
  display: flex;
  > .column {
    display: flex;
    flex-direction: column;
    :first-child {
      flex: 0 0 464px;
      margin-right: 20px;
    }
    :last-child {
      > :not(:last-child) {
        border-bottom: 1px solid ${theme.contentBorder};
      }
    }
    > * {
      margin-bottom: 30px;
      > * {
        margin-bottom: 20px;
      }
    }
  }
`

export default Settings
