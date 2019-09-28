import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import NumberFormat from 'react-number-format'

import { useNetwork } from '../../api-react'
import {
  Box,
  DropDown,
  Button,
  Field,
  Info,
  Text,
  TextInput,
  useLayout,
  useTheme,
} from '@aragon/ui'

import { FieldTitle } from '../Form'
import { LocalIdentityBadge } from '../../../../../shared/identity'
import { STATUS } from '../../utils/github'
import { fromUtf8, toHex } from 'web3-utils'
import { REQUESTED_GITHUB_DISCONNECT } from '../../store/eventTypes'
import useGithubAuth from '../../hooks/useGithubAuth'

const bountyDeadlines = [ 'Weeks', 'Days', 'Hours' ]
const bountyDeadlinesMul = [ 168, 24, 1 ] // it is one variable in contract, so number * multiplier = hours

const GitHubConnect = ({ onLogin, onLogout, status }) => {
  const { login: user } = useGithubAuth()
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
    <Box heading="GitHub">
      <Text.Block size="large" weight="bold">
        GitHub Authorization
      </Text.Block>
      <Text.Block>{bodyText}</Text.Block>
      <StyledButton
        compact
        mode="secondary"
        onClick={buttonAction}
      >
        {buttonText}
      </StyledButton>
    </Box>
  )
}

GitHubConnect.propTypes = {
  onLogin: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
}

const BountyContractAddress = ({ bountyAllocator, networkType, layoutName }) => (
  <Box heading="Bounty Address">
    <LocalIdentityBadge
      networkType={networkType}
      entity={bountyAllocator}
      shorten={layoutName === 'small'}
    />
    <Info css="margin-top: 16px">
      This address is the smart contract responsible for allocating bounties.
    </Info>
  </Box>
)

BountyContractAddress.propTypes = {
  bountyAllocator: PropTypes.string.isRequired,
  networkType: PropTypes.string.isRequired,
  layoutName: PropTypes.string.isRequired,
}

const SettingLabel = ({ text }) => {
  const theme = useTheme()

  return (
    <Text.Block
      size="large"
      color={`${theme.surfaceContentSecondary}`}
      style={{ marginBottom: '12px' }}
    >
      {text}
    </Text.Block>
  )
}
SettingLabel.propTypes = {
  text: PropTypes.string.isRequired,
}

const ExperienceLevel = ({
  expLevels,
  onAddExpLevel,
  generateExpLevelHandler,
}) => {
  let last = expLevels[expLevels.length - 1]
  let disableAdd = last.mul !== '' && last.name !== '' ? false : true
  return (
    <div>
      <SettingLabel text="Difficulty multipliers" />

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
ExperienceLevel.propTypes = {
  expLevels: PropTypes.array.isRequired,
  onAddExpLevel: PropTypes.func.isRequired,
  generateExpLevelHandler: PropTypes.func.isRequired,
}

const EmptyBaseRate = () => (
  <div css="margin-bottom: 12px">
    <SettingLabel text="Base rate" />
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
    <SettingLabel text="Base rate" />
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

BaseRate.propTypes = {
  baseRate: PropTypes.number.isRequired,
  onChangeRate: PropTypes.func.isRequired,
  bountyCurrency: PropTypes.number.isRequired,
  onChangeCurrency: PropTypes.func.isRequired,
  bountyCurrencies: PropTypes.array.isRequired,
}

const BountyDeadline = ({
  bountyDeadlineT,
  onChangeT,
  bountyDeadlineD,
  onChangeD,
}) => (
  <div>
    <SettingLabel text="Default work deadline" />
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
BountyDeadline.propTypes = {
  bountyDeadlineT: PropTypes.number.isRequired,
  onChangeT: PropTypes.func.isRequired,
  bountyDeadlineD: PropTypes.number.isRequired,
  onChangeD: PropTypes.func.isRequired,
}

const BountyArbiter = ({ bountyArbiter, networkType }) => (
  <div>
    <SettingLabel text="Bounty Arbiter" />
    <div css="display: flex">
      <LocalIdentityBadge
        networkType={networkType}
        entity={bountyArbiter}
        // TODO:
        // shorten={false}
      />
    </div>
  </div>
)
BountyArbiter.propTypes = {
  bountyArbiter: PropTypes.string.isRequired,
  networkType: PropTypes.string.isRequired,
}







class Settings extends React.Component {
  static propTypes = {
    app: PropTypes.object.isRequired,
    bountySettings: PropTypes.object.isRequired,
    network: PropTypes.object,
    onLogin: PropTypes.func.isRequired,
    status: PropTypes.string.isRequired,
    tokens: PropTypes.array.isRequired,
    layoutName: PropTypes.string.isRequired,
    theme: PropTypes.object,
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
      if (s.bountyDeadline % bountyDeadlinesMul[i] === 0) {
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
    if (key === 'M') expLevels[index].mul = e.target.value
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
    } = this.state

    const { network, layoutName } = this.props

    // TODO: hourglass in case settings are still being loaded
    if (!('baseRate' in this.props.bountySettings))
      return <div>Loading settings...</div>


      

    return (
      <SettingsMain layoutName={layoutName}>
        <div css="grid-area: contract">
          <BountyContractAddress
            bountyAllocator={bountyAllocator}
            networkType={network.type}
            layoutName={layoutName}
          />
        </div>
        <div css="grid-area: github">
          <GitHubConnect
            onLogin={this.props.onLogin}
            onLogout={this.handleLogout}
            status={this.props.status}
          />
        </div>
        <div css="grid-area: funding">
          <Box
            heading="Funding Model"
          >
            <SettingsFunding layoutName={layoutName}>
              <div>
                {!this.props.tokens.length ? (
                  <EmptyBaseRate />
                ) : (
                  <BaseRate
                    baseRate={baseRate}
                    onChangeRate={this.baseRateChange}
                    bountyCurrencies={bountyCurrencies}
                    bountyCurrency={bountyCurrency}
                    onChangeCurrency={this.bountyCurrencyChange}
                  />
                )}
                <BountyDeadline
                  bountyDeadlineT={bountyDeadlineT}
                  onChangeT={this.bountyDeadlineChangeT}
                  bountyDeadlineD={bountyDeadlineD}
                  onChangeD={this.bountyDeadlineChangeD}
                />
              </div>
              <div>
                <ExperienceLevel
                  expLevels={expLevels}
                  onAddExpLevel={this.addExpLevel}
                  generateExpLevelHandler={this.generateExpLevelHandler}
                />
              </div>
            </SettingsFunding>

            <Info css="margin: 24px 0">
              In hourly funding, the hourly rate per issue is the base rate multiplied by the difficulty level selected for the issue.
            </Info>
            <Button mode="strong" onClick={this.submitChanges}>
              Save Changes
            </Button>
          </Box>
        </div>
      </SettingsMain>
    )
  }
}





const StyledInputDropDown = ({ children }) => {
  const theme = useTheme()

  return (
    <div css={`
      display: flex;
      min-width: 0;
      > :first-child {
        border-radius: 3px 0 0 3px;
        border: 1px solid ${theme.border};
        box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
        min-width: 84px;
        flex: ${({ wide }) => (wide ? 1 : 0)};
        z-index: 1;
        :focus {
          outline: 0;
          border: 1px solid ${theme.infoSurface};
        }
      }
      > :last-child > :first-child {
        border-radius: 0 3px 3px 0;
        margin-left: -1px;
      }
    `}>
      {children}
    </div>
  )
}

StyledInputDropDown.propTypes = {
  children: PropTypes.node.isRequired,
}


const SettingsMain = styled.div`
  display: grid;
  grid-gap: 12px;
  grid-template-areas: ${({ layoutName }) => layoutName === 'large' ? (`
    "github contract"
    "funding funding"
  `) : (`
    "github"
    "contract"
    "funding"
  `)};
  grid-template-columns: ${({ layoutName }) => layoutName === 'large' ? '1fr 1fr' : '1fr'};
  grid-template-rows: auto;
  align-items: stretch;
`
const SettingsFunding = styled.div`
  display: flex;
  flex-direction: ${({ layoutName })=> layoutName === 'small' ? 'column' : 'row'};
> * {
  width: 50%;
  padding-right: 20px;
}
`
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

const SettingsWrap = props => {
  const network = useNetwork()
  const { layoutName } = useLayout()
  const theme = useTheme()

  return <Settings theme={theme} layoutName={layoutName} network={network} {...props} />
}

export default SettingsWrap
