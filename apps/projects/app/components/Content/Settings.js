import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import {
  DropDown,
  Button,
  Field,
  IdentityBadge,
  Text,
  TextInput,
  theme,
  Viewport,
  breakpoint,
} from '@aragon/ui'
import { FieldTitle } from '../Form'
import NumberFormat from 'react-number-format'
import { STATUS } from '../../utils/github'
import { provideNetwork } from '../../../../../shared/ui'
import { fromUtf8, toHex } from '../../utils/web3-utils'
import { REQUESTED_GITHUB_DISCONNECT } from '../../store/eventTypes'


const bountyDeadlines = [ 'Weeks', 'Days', 'Hours' ]
const bountyDeadlinesMul = [ 168, 24, 1 ] // it is one variable in contract, so number * multiplier = hours

class Settings extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    githubCurrentUser: PropTypes.object, // TODO: is this required?
    network: PropTypes.object,
    onLogin: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
  }
  state = {
    bountyCurrencies: this.props.tokens.map(token => token.symbol),
  }

  /*
    props pass data directly from contract. Settings form needs that data to be modified
    before use. and then it is simpler to keep them in state, and adjusted before sending
    back to contract.
  */
  static getDerivedStateFromProps(props, state) {
    let bountyCurrencies = state.bountyCurrencies
    // is all configured already? TODO: it might be useful to check
    // if there was no update to settings (on chain) in the meantime,
    // and what to do in that case. as of now: changes are ignored.
    if ('baseRate' in state) return null

    // before data is downloaded from cache/chain
    if (!('bountySettings' in props && 'baseRate' in props.bountySettings))
      return null

    // data has just became available
    let s = props.bountySettings
    let bountyCurrency = props.tokens.findIndex(bounty => bounty.addr === s.bountyCurrency)
    let n = {
      baseRate: s.baseRate,
      bountyAllocator: s.bountyAllocator,
      bountyArbiter: s.bountyArbiter,
      expLevels: s.expLvls,
      bountyCurrency: bountyCurrency,
    }

    // bountyDeadlinesMul = [168, 24, 1]
    // in order to store the deadline as one number instead of two
    for (let i = 0; i < bountyDeadlinesMul.length; i++) {
      if (s.bountyDeadline % bountyDeadlinesMul[i] == 0) {
        n.bountyDeadlineD = i
        n.bountyDeadlineT = s.bountyDeadline / bountyDeadlinesMul[i]
        break
      }
    }

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
      bountyCurrencies,
      bountyArbiter,
    } = this.state
    // flatten deadline
    let bountyDeadline = bountyDeadlinesMul[bountyDeadlineD] * bountyDeadlineT
    // flatten expLevels
    const expLevelsDesc = expLevels.map(l => fromUtf8(l.name))
    // uint-ify EXP levels
    let expLevelsMul = expLevels.map(l => toHex(l.mul * 100))
    this.props.app.changeBountySettings(
      expLevelsMul,
      expLevelsDesc,
      toHex(baseRate * 100),
      toHex(bountyDeadline),
      this.props.tokens[bountyCurrency].addr,
      bountyAllocator
      //bountyArbiter,
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

  handleLogout = () => {
    this.props.app.cache('github', {
      event: REQUESTED_GITHUB_DISCONNECT,
      status: STATUS.INITIAL,
      token: null,
    })
  }

  render() {
    const {
      baseRate,
      expLevels,
      bountyCurrencies,
      bountyCurrency,
      bountyDeadlineT,
      bountyDeadlineD,
      bountyAllocator,
      bountyArbiter,
    } = this.state

    const { network } = this.props

    // TODO: hourglass in case settings are still being loaded
    if (!('baseRate' in this.props.bountySettings))
      return <div>Loading settings...</div>

    const gitHubConnect = (
      <GitHubConnect
        onLogin={this.props.onLogin}
        onLogout={this.handleLogout}
        status={this.props.status}
        user={this.props.githubCurrentUser.login}
      />
    )

    const experienceLevel = (
      <ExperienceLevel
        expLevels={expLevels}
        onAddExpLevel={this.addExpLevel}
        generateExpLevelHandler={this.generateExpLevelHandler}
      />
    )
    const showBaseRate = !this.props.tokens.length ? (
      <EmptyBaseRate />
    ) : (
      <BaseRate
        baseRate={baseRate}
        onChangeRate={this.baseRateChange}
        bountyCurrencies={bountyCurrencies}
        bountyCurrency={bountyCurrency}
        onChangeCurrency={this.bountyCurrencyChange}
      />
    )
    const bountyDeadline = (
      <BountyDeadline
        bountyDeadlineT={bountyDeadlineT}
        onChangeT={this.bountyDeadlineChangeT}
        bountyDeadlineD={bountyDeadlineD}
        onChangeD={this.bountyDeadlineChangeD}
      />
    )

    const bountyContractAddress = (
      <BountyContractAddress
        bountyAllocator={bountyAllocator}
        networkType={network.type}
      />
    )

    const saveButton = (
      <Button mode="strong" onClick={this.submitChanges} wide>
        Submit Changes
      </Button>
    )

    return (
      <StyledContent>
        <Viewport>
          {({ above }) =>
            above(900) ? (
              <React.Fragment>
                <div className="column">
                  {gitHubConnect}
                  <Separator />
                  {experienceLevel}
                  {saveButton}
                </div>
                <div className="column">
                  {showBaseRate}
                  <Separator />
                  {bountyDeadline}
                  <Separator />
                  {bountyContractAddress}
                </div>
              </React.Fragment>
            ) : (
              <div className="column">
                {gitHubConnect}
                <Separator />
                {experienceLevel}
                <Separator />
                {showBaseRate}
                <Separator />
                {bountyDeadline}
                <Separator />
                {bountyContractAddress}
                {saveButton}
              </div>
            )
          }
        </Viewport>
      </StyledContent>
    )
  }
}

const BountyDeadline = ({
  bountyDeadlineT,
  onChangeT,
  bountyDeadlineD,
  onChangeD,
}) => (
  <div>
    <Text.Block size="large" weight="bold">
      Bounty Deadline
    </Text.Block>
    <Text.Block>
      The default amount of time contributors have to submit work once a bounty
      is activated.
    </Text.Block>
    <StyledInputDropDown>
      <StyledNumberFormat
        fixedDecimalScale
        decimalScale={0}
        value={bountyDeadlineT}
        allowNegative={false}
        onChange={onChangeT}
        style={{ marginRight: '0' }}
      />
      <DropDown
        items={bountyDeadlines}
        active={bountyDeadlineD}
        onChange={onChangeD}
      />
    </StyledInputDropDown>
  </div>
)

const BountyArbiter = ({ bountyArbiter, networkType }) => (
  <div>
    <Text.Block size="large" weight="bold">
      Bounty Arbiter
    </Text.Block>
    <Text.Block>The entity responsible for dispute resolution.</Text.Block>
    <div style={{ display: 'flex' }}>
      <IdentityBadge
        networkType={networkType}
        entity={bountyArbiter}
        shorten={false}
      />
    </div>
  </div>
)

const BountyContractAddress = ({ bountyAllocator, networkType }) => (
  <div>
    <Text.Block size="large" weight="bold">
      Bounty Contract Address
    </Text.Block>
    <Text.Block>
      This is the smart contract that is actually allocating bounties.
    </Text.Block>
    <div style={{ display: 'flex' }}>
      <Viewport>
        {({ below }) => {
          const shorten = below('small')
          return (
            <IdentityBadge
              networkType={networkType}
              entity={bountyAllocator}
              shorten={shorten}
            />
          )}}
      </Viewport>
    </div>
  </div>
)

const StyledInputDropDown = styled.div`
  display: flex;
  min-width: 0;
  > :first-child {
    border-radius: 3px 0 0 3px;
    border: 1px solid ${theme.contentBorder};
    box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
    min-width: 84px;
    flex: ${({ wide }) => (wide ? 1 : 0)};
    z-index: 1;
    :focus {
      outline: 0;
      border: 1px solid ${theme.contentBorderActive};
    }
  }
  > :last-child > :first-child {
    border-radius: 0 3px 3px 0;
    margin-left: -1px;
  }
`
const EmptyBaseRate = () => (
  <div>
    <Text.Block size="large" weight="bold">
      Bounty Base Rate
    </Text.Block>
    <Text.Block>
      Once you have tokens in your Vault you will be able to set your
      bounty base rate, which provides you with the ability to allocate bounties to issues.
    </Text.Block>
  </div>
)
const BaseRate = ({
  baseRate,
  onChangeRate,
  bountyCurrency,
  onChangeCurrency,
  bountyCurrencies,
}) => (
  <div>
    <Text.Block size="large" weight="bold">
      Bounty Base Rate
    </Text.Block>
    <Text.Block>
      Define your organization’s hourly rate. This is multiplied by the bounty
      size and converted into the bounty currency under the hood.
    </Text.Block>
    <FieldTitle style={{ marginBottom: '0' }}>Rate per hour</FieldTitle>
    <StyledInputDropDown>
      <StyledNumberFormat
        fixedDecimalScale
        decimalScale={2}
        value={baseRate}
        allowNegative={false}
        onChange={onChangeRate}
        style={{ marginRight: '0' }}
      />
      <DropDown
        items={bountyCurrencies}
        active={bountyCurrency}
        onChange={onChangeCurrency}
      />
    </StyledInputDropDown>
  </div>
)

const GitHubConnect = ({ onLogin, onLogout, status, user }) => {
  const auth = status === STATUS.AUTHENTICATED
  const bodyText = auth ? (
    <span>
      Logged in as
      <Text weight="bold"> {user}</Text>
    </span>
  ) : (
    'The Projects app uses GitHub to interact with issues.'
  )
  const buttonText = auth ? 'Disconnect Account' : 'Connect my GitHub'
  const buttonAction = auth ? onLogout : onLogin
  return (
    <div>
      <Text.Block
        size="large"
        weight="bold"
        children={'GitHub Authorization'}
      />
      <Text.Block children={bodyText} />
      <StyledButton
        compact
        mode="secondary"
        onClick={buttonAction}
        children={buttonText}
      />
    </div>
  )
}

GitHubConnect.propTypes = {
  onLogin: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  user: PropTypes.string, // TODO: is this required?
}

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
          <StyledNumberFormat
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

const StyledNumberFormat = styled(NumberFormat)`
  border-radius: 3px;
  border: 1px solid #e6e6e6;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
  font-size: 16px;
  height: 40px;
  line-height: 1.5;
  margin-right: 10px;
  padding: 0 10px;
  text-align: right;
  width: 131px;
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
  margin-top: 8px;
`
// padding-left: 30px;
// background: url(${cross}) no-repeat 10px calc(50% - 1px);

const StyledContent = styled.div`
  ${breakpoint(
    'small',
    `
    padding: 2rem;
    `
  )};
  padding: 0.3rem;
  display: flex;
  height: fit-content;
  width: 100%;
  > .column {
    display: flex;
    flex-direction: column;
    min-width: 364px;
    max-width: 464px;
    :first-child {
      width: 100%;
      margin-right: 30px;
    }
    :last-child {
      width: 100%;
    }
    > * {
      > * {
        margin-bottom: 10px;
      }
    }
  }
`
const Separator = styled.hr`
  height: 1px;
  border: 0;
  width: 100%;
  margin: 10px 0;
  background: ${theme.contentBorder};
`

export default provideNetwork(Settings)
