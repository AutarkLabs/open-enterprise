import React from 'react'
import styled from 'styled-components'
import { DropDown, Button, Text, Field, TextInput, theme } from '@aragon/ui'
import NumberFormat from 'react-number-format'

const bountyDeadlines = ['Weeks', 'Days', 'Hours']
const bountyDeadlinesMul = [168, 24, 1] // it is one variable in contract, so number * multiplier = hours
const bountyCurrencies = ['BTC', 'ETH', 'TL', 'ANT', '🦄']

class Settings extends React.Component {
  state = {}
  /*
    props pass data directly from contract. Settings form needs that data to be modified
    before use. and then it is simpler to keep them in state, and adjusted before sending
    back to contract.
  */
  static getDerivedStateFromProps(props, state) {
    // is all configured already? TODO: it might be useful to check
    // if there was no update to settings (on chain) in the meantime,
    // and what to do in that case. as of now: changes are ignored.
    if ('baseRate' in state) return null

    // before data is downloaded from cache/chain
    if (!('bountySettings' in props && 'baseRate' in props.bountySettings))
      return null

    // data has just became available
    let s = props.bountySettings
    let n = {
      baseRate: s.baseRate / 100,
      bountyAllocator: s.bountyAllocator,
      bountyArbiter: s.bountyArbiter,
      expLevels: [],
    }

    let found = bountyCurrencies.findIndex(el => el == s.bountyCurrency)

    if (found == -1) {
      bountyCurrencies.push(s.bountyCurrency)
      n.bountyCurrency = bountyCurrencies.length - 1
    } else n.bountyCurrency = found

    // bountyDeadlinesMul = [168, 24, 1]
    // in order to store the deadline as one number instead of two
    for (let i = 0; i < bountyDeadlinesMul.length; i++) {
      if (s.bountyDeadline % bountyDeadlinesMul[i] == 0) {
        n.bountyDeadlineD = i
        n.bountyDeadlineT = s.bountyDeadline / bountyDeadlinesMul[i]
        break
      }
    }
    let a = s.expLevels.split('\t')
    for (let i = 0; i < a.length; i += 2)
      n.expLevels.push({ mul: a[i] / 100, name: a[i + 1] })

    return n
  }

  submitChanges = () => {
    const {
      baseRate,
      expLevels,
      bountyDeadlineT,
      bountyDeadlineD,
      bountyCurrency,
      bountyAllocator,
      bountyArbiter,
    } = this.state
    // flatten deadline
    let bountyDeadline = bountyDeadlinesMul[bountyDeadlineD] * bountyDeadlineT
    // flatten expLevels
    let expLevelsStr = expLevels
      .map(l => l.mul * 100 + '\t' + l.name)
      .join('\t')
    console.log('Submitting new Settings: ', {
      lvl: expLevelsStr,
      rate: web3.toHex(baseRate),
      ddl: web3.toHex(bountyDeadline),
      cur: bountyCurrencies[bountyCurrency],
      bountyArbiter,
      bountyAllocator,
    })

    //expLevels, baseRate, bountyDeadline, bountyCurrency, bountyAllocator, bountyArbiter
    this.props.app.changeBountySettings(
      expLevelsStr,
      web3.toHex(baseRate),
      web3.toHex(bountyDeadline),
      bountyCurrencies[bountyCurrency],
      bountyArbiter,
      bountyAllocator
    )
  }

  baseRateChange = e => {
    this.setState({ baseRate: e.target.value })
  }
  bountyDeadlineChangeT = e => {
    this.setState({ bountyDeadlineT: e.target.value })
  }
  bountyDeadlineChangeD = index => {
    this.setState({ bountyDeadlineD: index })
  }
  bountyCurrencyChange = index => {
    this.setState({ bountyCurrency: index })
  }
  bountyAllocatorChange = e => {
    this.setState({ bountyAllocator: e.target.value })
  }
  bountyArbiterChange = e => {
    this.setState({ bountyArbiter: e.target.value })
  }

  addExpLevel = () => {
    let { expLevels } = this.state
    expLevels.push({ name: '', mul: 1 })
    this.setState({ expLevels })
  }

  generateExpLevelHandler = (index, key) => e => {
    let { expLevels } = this.state
    if (key == 'M') expLevels[index].mul = e.target.value
    else expLevels[index].name = e.target.value
    this.setState({ expLevels })
  }

  render() {
    const {
      baseRate,
      expLevels,
      bountyCurrency,
      bountyDeadlineT,
      bountyDeadlineD,
      bountyAllocator,
      bountyArbiter,
    } = this.state

    //console.log('SETTINGS RENDER PROPS: ', this.props.bountySettings)
    //console.log('SETTINGS RENDER STATE: ', this.state)

    // TODO: hourglass in case settings are still being loaded
    if (!('baseRate' in this.props.bountySettings))
      return <div>Loading settings...</div>

    return (
      <StyledContent>
        <div className="column">
          <ExperienceLevel
            expLevels={expLevels}
            onAddExpLevel={this.addExpLevel}
            generateExpLevelHandler={this.generateExpLevelHandler}
          />
          <BaseRate baseRate={baseRate} onChange={this.baseRateChange} />
          <Button mode="strong" onClick={this.submitChanges} wide>
            Submit Changes
          </Button>
        </div>
        <div className="column">
          <BountyContractAddress
            bountyAllocator={bountyAllocator}
            onChange={this.bountyAllocatorChange}
          />
          <BountyCurrency
            bountyCurrency={bountyCurrency}
            onChange={this.bountyCurrencyChange}
          />
          <BountyArbiter
            bountyArbiter={bountyArbiter}
            onChange={this.bountyArbiterChange}
          />
          <BountyDeadline
            bountyDeadlineT={bountyDeadlineT}
            onChangeT={this.bountyDeadlineChangeT}
            bountyDeadlineD={bountyDeadlineD}
            onChangeD={this.bountyDeadlineChangeD}
          />
        </div>
      </StyledContent>
    )
  }
}

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

const BountyDeadline = ({
  bountyDeadlineT,
  onChangeT,
  bountyDeadlineD,
  onChangeD,
}) => (
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
        value={bountyDeadlineT}
        allowNegative={false}
        onChange={onChangeT}
      />
      <DropDown
        items={bountyDeadlines}
        active={bountyDeadlineD}
        onChange={onChangeD}
      />
    </StyledInputDropDown>
  </div>
)

const BountyArbiter = ({ bountyArbiter, onChange }) => (
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

const BountyCurrency = ({ bountyCurrency, onChange }) => (
  <div>
    <Text.Block size="large" weight="bold">
      Bounty Currency
    </Text.Block>
    <Text.Block>The default currency used when allocating bounties.</Text.Block>
    <Field label="Select currency">
      <DropDown
        items={bountyCurrencies}
        active={bountyCurrency}
        onChange={onChange}
      />
      <StyledInputDropDown style={{ paddingLeft: '11px' }} />
    </Field>
  </div>
)

const BountyContractAddress = ({ bountyAllocator, onChange }) => (
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
      value={bountyAllocator}
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

const BaseRate = ({ baseRate, onChange }) => (
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
        value={baseRate}
        allowNegative={false}
        onChange={onChange}
      />
      <Text>USD</Text>
    </Field>
  </div>
)

const ExperienceLevel = ({
  expLevels,
  onAddExpLevel,
  generateExpLevelHandler,
}) => {
  let last = expLevels[expLevels.length - 1]
  let disableAdd = last.mul != '' && last.name != '' ? false : true
  return (
    <div>
      <Text.Block size="large" weight="bold">
        Experience Level
      </Text.Block>
      <Text.Block>Define the experience level multipliers.</Text.Block>
      {expLevels.map((exp, index) => (
        <Field key={index} label={'LEVEL ' + index}>
          <NumberFormat
            customInput={StyledNumberInput}
            fixedDecimalScale
            decimalScale={2}
            value={exp.mul}
            allowNegative={false}
            onChange={generateExpLevelHandler(index, 'M')}
          />
          <StyledTextInput
            defaultValue={exp.name}
            onChange={generateExpLevelHandler(index, 'N')}
          />
        </Field>
      ))}
      <StyledButton
        disabled={disableAdd}
        compact
        mode="secondary"
        onClick={onAddExpLevel}
      >
        + Add Another
      </StyledButton>
    </div>
  )
}

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
