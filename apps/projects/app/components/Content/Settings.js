import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import NumberFormat from 'react-number-format'
import { useAragonApi, useNetwork } from '../../api-react'
import {
  Box,
  DropDown,
  Button,
  Field,
  GU,
  Info,
  Link,
  Text,
  TextInput,
  useLayout,
  useTheme,
} from '@aragon/ui'

import { LocalIdentityBadge } from '../../../../../shared/identity'
import { STATUS } from '../../utils/github'
import { fromUtf8, toHex } from 'web3-utils'
import { REQUESTED_GITHUB_DISCONNECT } from '../../store/eventTypes'
import useGithubAuth from '../../hooks/useGithubAuth'
import { LoadingAnimation } from '../Shared'
import { EmptyWrapper } from '../Shared'

const bountyDeadlines = [ 'Days', 'Weeks', 'Months' ]
const bountyDeadlinesMul = [ 24, 168, 720 ]

const GitHubConnect = ({ onLogin, onLogout, status }) => {
  const user = useGithubAuth()
  const theme = useTheme()
  const auth = status === STATUS.AUTHENTICATED

  const bodyText = auth ? (
    <Text size="large" css="display: flex; align-items: center">
      Logged in as <img src={user.avatarUrl} alt="user avatar" css="margin: 8px; width: 50px; border-radius: 50%;" />
      <Link
        href={user.url}
        target="_blank"
        style={{ textDecoration: 'none', color: `${theme.link}` }}
      >
        {user.login}
      </Link>
    </Text>
  ) : (
    'The Projects app uses GitHub to interact with issues.'
  )
  const buttonText = auth ? 'Disconnect' : 'Connect my GitHub'
  const buttonAction = auth ? onLogout : onLogin
  return (
    <Box heading="GitHub" css="height: 100%">
      <Text.Block>{bodyText}</Text.Block>
      <StyledButton
        wide
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
  <Box heading="Bounty Address" css="height: 100%">
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
  <div css="margin-bottom: 24px">
    <SettingLabel text="Base rate" />
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
        selected={bountyCurrency}
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
        decimalScale={1}
        value={bountyDeadlineT}
        allowNegative={false}
        onChange={onChangeT}
        style={{ marginRight: '0' }}
      />
      <DropDown
        items={bountyDeadlines}
        selected={bountyDeadlineD}
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

const FundingType = ({ fundingType, onChangeType }) => (
  <div css="margin-bottom: 24px; width: 240px">
    <SettingLabel text="Type" />
    <DropDown
      items={[ 'Hourly', 'Fixed' ]}
      selected={fundingType}
      onChange={onChangeType}
      wide
    />
  </div>
)
FundingType.propTypes = {
  fundingType: PropTypes.number.isRequired,
  onChangeType: PropTypes.func.isRequired,
}

const getExactIndex = (bountyDeadline, bountyDeadlinesMul) => {
  for (let i = bountyDeadlinesMul.length - 1; i >= 0; i--) {
    if (bountyDeadline % bountyDeadlinesMul[i] === 0) {
      return i
    }
  }
  return -1
}

const Settings = ({ onLogin }) => {
  const [ bountyCurrencies, setBountyCurrencies ] = useState([])
  const [ expLevels, setExpLevels ] = useState([])
  const [ baseRate, setBaseRate ] = useState(0)
  const [ bountyCurrency, setBountyCurrency ] = useState()
  const [ bountyAllocator, setBountyAllocator ] = useState()
  //const [ bountyArbiter, setBountyArbiter ] = useState()
  const [ bountyDeadlineD, setBountyDeadlineD ] = useState()
  const [ bountyDeadlineT, setBountyDeadlineT ] = useState()
  //const [ fundingType, setFundingType ] = useState(0)
  const [ settingsLoaded, setSettingsLoaded ] = useState(false)

  const { api, appState } = useAragonApi()
  const network = useNetwork()
  const { layoutName } = useLayout()
  const {
    bountySettings = {},
    tokens = [],
    github = { status : STATUS.INITIAL },
  } = appState

  useEffect(() => {
    setBountyCurrencies(tokens.map(token => token.symbol))
  }, [tokens]
  )

  useEffect(() => {
    const {
      expLvls,
      baseRate,
      bountyCurrency,
      bountyAllocator,
      bountyDeadline
    } = bountySettings
    setExpLevels(expLvls)
    setBaseRate(baseRate)
    setBountyCurrency(tokens.findIndex(bounty => bounty.addr === bountyCurrency))
    setBountyAllocator(bountyAllocator)
    let index = getExactIndex(bountyDeadline, bountyDeadlinesMul)
    if (index === -1) {
      const reverseDeadlinesMul = [...bountyDeadlinesMul].sort((a, b) => b - a)
      const deadlineMul = reverseDeadlinesMul.find(d => d * 2 <= bountyDeadline)
      index = bountyDeadlinesMul.indexOf(deadlineMul)
    }
    setBountyDeadlineD(index)
    setBountyDeadlineT(bountyDeadline / bountyDeadlinesMul[index])
    setSettingsLoaded(true)
  }, [bountySettings]
  )

  const submitChanges = () => {
    // flatten deadline
    let bountyDeadline = Math.floor(bountyDeadlinesMul[bountyDeadlineD] * bountyDeadlineT)
    // flatten expLevels
    const expLevelsDesc = expLevels.map(l => fromUtf8(l.name))
    // uint-ify EXP levels
    let expLevelsMul = expLevels.map(l => toHex(l.mul * 100))

    api.changeBountySettings(
      expLevelsMul,
      expLevelsDesc,
      toHex(baseRate * 100),
      toHex(bountyDeadline),
      tokens[bountyCurrency].addr,
      bountyAllocator
      //bountyArbiter,
    ).toPromise()
  }

  const baseRateChange = e => setBaseRate(e.target.value)
  const bountyDeadlineChangeT = e => setBountyDeadlineT(Number(e.target.value))
  const bountyDeadlineChangeD = index => setBountyDeadlineD(index)
  const bountyCurrencyChange = index => setBountyCurrency(index)
  // Unconfigurables (for now):
  // const fundingTypeChange = index => setFundingType(index)
  // const bountyAllocatorChange = e => setBountyAllocator(e.target.value)
  // const bountyArbiterChange = e => setBountyArbiter(e.target.value)

  const addExpLevel = () => {
    const newExpLevels = [ ...expLevels, { name: '', mul: 1 }]
    setExpLevels(newExpLevels)
  }

  const generateExpLevelHandler = (index, key) => e => {
    const newExpLevels = [...expLevels]
    if (key === 'M') newExpLevels[index].mul = e.target.value
    else newExpLevels[index].name = e.target.value
    setExpLevels(newExpLevels)
  }

  const handleLogout = () => {
    api.trigger(REQUESTED_GITHUB_DISCONNECT, {
      status: STATUS.INITIAL,
      token: null,
    })
  }

  if (!settingsLoaded)
    return (
      <EmptyWrapper>
        <Text size="large" css={`margin-bottom: ${3 * GU}px`}>
          Loading settings...
        </Text>
        <LoadingAnimation />
      </EmptyWrapper>
    )

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
          onLogin={onLogin}
          onLogout={handleLogout}
          status={github.status}
        />
      </div>
      <div css="grid-area: funding">
        <Box
          heading="Funding Model"
        >
          <SettingsFunding layoutName={layoutName}>
            <div>
              {!tokens.length ? (
                <EmptyBaseRate />
              ) : (
                <BaseRate
                  baseRate={baseRate}
                  onChangeRate={baseRateChange}
                  bountyCurrencies={bountyCurrencies}
                  bountyCurrency={bountyCurrency}
                  onChangeCurrency={bountyCurrencyChange}
                />
              )}
              <BountyDeadline
                bountyDeadlineT={bountyDeadlineT}
                onChangeT={bountyDeadlineChangeT}
                bountyDeadlineD={bountyDeadlineD}
                onChangeD={bountyDeadlineChangeD}
              />
            </div>
            <div>
              <ExperienceLevel
                expLevels={expLevels}
                onAddExpLevel={addExpLevel}
                generateExpLevelHandler={generateExpLevelHandler}
              />
            </div>
          </SettingsFunding>

          <Button mode="strong" onClick={submitChanges}>
              Save Changes
          </Button>
        </Box>
      </div>
    </SettingsMain>
  )
}

Settings.propTypes = {
  onLogin: PropTypes.func.isRequired,
}

const StyledInputDropDown = ({ children }) => {
  const theme = useTheme()

  return (
    <div css={`
      display: flex;
      width: 240px;
      > :first-child {
        border-radius: 3px 0 0 3px;
        border: 1px solid ${theme.border};
        box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
        width: 140px;
        z-index: 1;
        :focus {
          outline: 0;
          border: 1px solid ${theme.infoSurface};
        }
      }
      > :second-child {
        border-radius: 0 3px 3px 0;
        margin-left: -1px;
        width: 100px;
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
  width: 110px;
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

export default Settings
