import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import {
  Button,
  DropDown,
  IconCaution,
  IconClose,
  IdentityBadge,
  Info,
  Text,
  TextInput,
  useTheme,
} from '@aragon/ui'

import { Form, FormField } from '../../Form'
import { DateInput } from '../../../../../../shared/ui'
import moment from 'moment'
import { isAddress } from '../../../utils/web3-utils'
import { ETHER_TOKEN_VERIFIED_BY_SYMBOL } from '../../../utils/verified-tokens'
import TokenSelectorInstance from './TokenSelectorInstance'
import {
  MIN_AMOUNT,
  REWARD_TYPES,
  ONE_TIME_DIVIDEND,
  RECURRING_DIVIDEND,
  ONE_TIME_MERIT,
  MONTHS,
  DISBURSEMENT_UNITS,
  OTHER,
} from '../../../utils/constants'
import { displayCurrency, toWei } from '../../../utils/helpers'

import tokenBalanceOfAbi from '../../../../../shared/json-abis/token-balanceof.json'
import tokenBalanceOfAtAbi from '../../../../../shared/json-abis/token-balanceofat.json'
import tokenCreationBlockAbi from '../../../../../shared/json-abis/token-creationblock.json'
import tokenSymbolAbi from '../../../../../shared/json-abis/token-symbol.json'
import tokenTransferAbi from '../../../../../shared/json-abis/token-transferable.json'

const tokenAbi = [].concat(tokenBalanceOfAbi, tokenBalanceOfAtAbi, tokenCreationBlockAbi, tokenSymbolAbi)

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)

const INITIAL_STATE = {
  description: '',
  referenceAsset: null,
  referenceAssets: [],
  customToken: {
    isVerified: false,
    value: '',
    address: '',
  },
  rewardType: null,
  amount: '',
  amountToken: {
    balance: '',
    symbol: '',
  },
  dateReference: tomorrow,
  dateStart: tomorrow,
  dateEnd: tomorrow,
  disbursement: '',
  disbursementUnit: MONTHS,
  disbursements: [tomorrow],
  draftSubmitted: false,
  semanticErrors: [],
  warnings: [],
  messages: {
    customTokenInvalid: 'Token address must be of a valid ERC20 compatible clonable token.',
    meritTokenTransferable: 'Merit rewards must be non-transferable.',
    amountOverBalance: 'Amount must be below the available balance.',
    dateReferencePassed: 'Reference date must take place after today.',
    dateStartPassed: 'Start date must take place after today.',
    dateEndPassed: 'End date must take place after today.',
    dateStartAfterEnd: 'Start date must take place before the end date.',
    singleDisbursement: 'While you selected a recurring dividend, based on your parameters, there will only be a single disbursement.',
  },
}

class NewRewardClass extends React.Component {
  static propTypes = {
    onNewReward: PropTypes.func.isRequired,
    app: PropTypes.object,
    network: PropTypes.object,
    refTokens: PropTypes.array,
    amountTokens: PropTypes.arrayOf(PropTypes.object).isRequired,
    theme: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      ...INITIAL_STATE,
      amountToken: props.amountTokens[0],
      referenceAssets: this.getReferenceAssets()
    }
  }

  setDisbursements = (dateStart, dateEnd, disbursement, disbursementUnit) => {
    if (isNaN(disbursement) || disbursement <= 0 ||
        this.state.rewardType !== RECURRING_DIVIDEND) {
      this.setState({ disbursements: [] })
      this.setSemanticErrors({ dateStart, dateEnd })
      return
    }
    let date = moment(dateStart), disbursements = []
    while (!date.isAfter(dateEnd, 'days')) {
      disbursements.push(date.toDate())
      date.add(disbursement, disbursementUnit)
    }
    this.setState({ disbursements })
    this.setSemanticErrors({ dateStart, dateEnd, disbursements })
  }

  changeField = ({ target: { name, value } }) => {
    this.setState({ [name]: value })
    if (name === 'amount')
      this.setSemanticErrors({ amount: value })
  }

  dropDownItems = (name) => {
    if (name == 'amountToken') {
      return this.props.amountTokens.map(token => token.symbol)
    }
    return this.props[name + 's']
  }

  dropDownSelect = (name) => {
    return this.props[name + 's'].indexOf(this.state[name])
  }

  dropDownChange = (name, index) => {
    this.setState({
      [name]: this.props[name + 's'][index],
    })
  }

  onSubmit = () => {
    this.props.onNewReward(this.state)
  }

  submitDraft = () => {
    this.setState({ draftSubmitted: true })
  }

  isDraftValid = () => {
    const {
      description,
      referenceAsset,
      rewardType,
      amount,
      amountToken,
      disbursement,
      semanticErrors,
    } = this.state
    const valid = (
      description !== '' &&
        referenceAsset !== null &&
        !isNaN(amount) && +amount > MIN_AMOUNT &&
        amountToken.symbol !== '' &&
        rewardType !== null && (
        rewardType !== RECURRING_DIVIDEND || (
          !isNaN(disbursement) && +disbursement > 0 &&
              Math.floor(disbursement) === +disbursement
        )
      ) &&
        semanticErrors.length === 0
    )
    return valid
  }

  setSemanticErrors = (changed) => {
    const state = { ...this.state, ...changed }
    const semanticErrors = []
    const warnings = []
    if (state.referenceAsset === OTHER && !state.customToken.isVerified)
      semanticErrors.push('customTokenInvalid')
    if (state.rewardType === ONE_TIME_MERIT && state.transferable)
      semanticErrors.push('meritTokenTransferable')
    if (toWei(state.amount) > +state.amountToken.amount)
      semanticErrors.push('amountOverBalance')
    if (state.rewardType === ONE_TIME_DIVIDEND &&
        moment(state.dateReference).isBefore(tomorrow, 'day'))
      semanticErrors.push('dateReferencePassed')
    if (state.rewardType === RECURRING_DIVIDEND ||
        state.rewardType === ONE_TIME_MERIT) {
      const start = moment(state.dateStart), end = moment(state.dateEnd)
      if (start.isBefore(tomorrow, 'day'))
        semanticErrors.push('dateStartPassed')
      if (end.isBefore(tomorrow, 'day'))
        semanticErrors.push('dateEndPassed')
      if (start.isAfter(end, 'day'))
        semanticErrors.push('dateStartAfterEnd')
    }
    if (state.rewardType === RECURRING_DIVIDEND &&
        state.disbursements.length <= 1)
      warnings.push('singleDisbursement')
    this.setState({ semanticErrors, warnings })
  }

  onMainNet = () => this.props.network.type === 'main'

  showSummary = () => (this.state.referenceAsset > 1 || this.state.customToken.symbol)

  getReferenceAssets() {
    if (!this.props.refTokens) {
      return ['Assets Loading...']
    }
    return [ ...this.getTokenItems(), OTHER ]
  }

  getTokenItems() {
    return this.props.refTokens
      .filter(token => token.startBlock ? true : false)
      .map(({ address, name, symbol, verified }) => (
        <TokenSelectorInstance
          key={address}
          address={address}
          name={name}
          showIcon={verified}
          symbol={symbol}
        />
      ))
  }

  handleCustomTokenChange = event => {
    const { value } = event.target
    const { network } = this.props
    let isVerified = null

    // Use the verified token address if provided a symbol and it matches
    // The symbols in the verified map are all capitalized
    const resolvedAddress =
      !isAddress(value) && network.type === 'main'
        ? ETHER_TOKEN_VERIFIED_BY_SYMBOL.get(value.toUpperCase()) || 'not found'
        : ''

    if (isAddress(value) || isAddress(resolvedAddress)) {
      this.verifyMinime(this.props.app, { address: resolvedAddress || value, value })
      this.verifyTransferable(this.props.app, resolvedAddress || value)
    }
    else {
      isVerified = false
    }
    const customToken = {
      isVerified,
      value,
      address: resolvedAddress,
    }
    this.setState({ customToken })
    this.setSemanticErrors({ customToken })
  }

  verifyMinime = async (app, tokenState) => {
    const tokenAddress = tokenState.address
    const token = app.external(tokenAddress, tokenAbi)
    const testAddress = '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7'
    const currentBlock = await app.web3Eth('getBlockNumber').toPromise()
    try {
      const verifiedTests = (await Promise.all([
        await token.balanceOf(testAddress).toPromise(),
        await token.creationBlock().toPromise(),
        await token.balanceOfAt(testAddress,currentBlock).toPromise(),
      ]))
      if (verifiedTests[0] !== verifiedTests[2]) {
        const customToken = { ...tokenState, isVerified: false }
        this.setState({ customToken  })
        this.setSemanticErrors({ customToken })
        return false
      }
      const customToken = {
        ...tokenState,
        isVerified: true,
        symbol: await token.symbol().toPromise(),
        startBlock: await token.creationBlock().toPromise(),
      }
      this.setState({ customToken })
      this.setSemanticErrors({ customToken })
      return true
    }
    catch (error) {
      const customToken = { ...tokenState, isVerified: false }
      this.setState({ customToken })
      this.setSemanticErrors({ customToken })
      return false
    }
  }

  verifyTransferable = async (app, tokenAddress) => {
    const token = app.external(tokenAddress, tokenTransferAbi)
    const transferable = await token.transfersEnabled().toPromise()
    this.setState({ transferable })
    this.setSemanticErrors({ transferable })
  }

  amountWithTokenAndBalance = () => (
    <VerticalContainer>
      <HorizontalContainer>
        <TextInput
          name="amount"
          type="number"
          min={MIN_AMOUNT}
          step="any"
          onChange={this.changeField}
          wide={true}
          value={this.state.amount}
          css={{ borderRadius: '4px 0px 0px 4px' }}
        />
        <DropDown
          name="amountToken"
          css={{ borderRadius: '0px 4px 4px 0px' }}
          items={this.dropDownItems('amountToken')}
          selected={this.dropDownSelect('amountToken')}
          onChange={i => {
            this.dropDownChange('amountToken', i)
            this.setSemanticErrors({ amountToken: this.props.amountTokens[i] })
          }}
        />
      </HorizontalContainer>
      <Text
        size="small"
        color={String(this.props.theme.contentSecondary)}
        css={{
          alignSelf: 'flex-end',
          marginTop: '8px',
        }}
      >
        {'Available Balance: '}
        {displayCurrency(this.state.amountToken.amount)}
        {' '}
        {this.state.amountToken.symbol}
      </Text>
    </VerticalContainer>
  )

  startAndEndDate = () => (
    <HorizontalContainer>
      <FormField
        label="Start date"
        required
        input={
          <DateInput
            position="left"
            name="dateStart"
            value={this.state.dateStart}
            onChange={dateStart => {
              this.setState({ dateStart })
              this.setDisbursements(
                dateStart,
                this.state.dateEnd,
                this.state.disbursement,
                this.state.disbursementUnit,
              )
            }}
          />
        }
      />
      <FormField
        label="End date"
        required
        input={
          <DateInput
            name="dateEnd"
            value={this.state.dateEnd}
            onChange={dateEnd => {
              this.setState({ dateEnd })
              this.setDisbursements(
                this.state.dateStart,
                dateEnd,
                this.state.disbursement,
                this.state.disbursementUnit,
              )
            }}
          />
        }
      />
    </HorizontalContainer>
  )

  oneTimeDividend = () => (
    <VerticalContainer>
      <FormField
        required
        label="Total amount"
        input={this.amountWithTokenAndBalance()}
      />
      <FormField
        label="Reference date"
        required
        input={
          <DateInput
            name="dateReference"
            value={this.state.dateReference}
            onChange={dateReference => {
              this.setState({ dateReference, })
              this.setSemanticErrors({ dateReference })
            }}
            wide
          />
        }
      />
    </VerticalContainer>
  )

  recurringDividend = () => (
    <VerticalContainer>
      <FormField
        required
        label="Amount per disbursement"
        input={this.amountWithTokenAndBalance()}
      />
      {this.startAndEndDate()}
      <FormField
        required
        label="Disbursement frequency"
        input={
          <HorizontalContainer>
            <DisbursementInput
              name="disbursement"
              type="number"
              min={1}
              step={1}
              onChange={e => {
                this.setState({ disbursement: e.target.value })
                this.setDisbursements(
                  this.state.dateStart,
                  this.state.dateEnd,
                  e.target.value,
                  this.state.disbursementUnit,
                )
              }}
              wide={true}
              value={this.state.disbursement}
            />
            <DropDown
              name="disbursementUnit"
              css={{ borderRadius: '0px 4px 4px 0px' }}
              items={DISBURSEMENT_UNITS}
              selected={DISBURSEMENT_UNITS.indexOf(this.state.disbursementUnit)}
              onChange={i => {
                this.setState({ disbursementUnit: DISBURSEMENT_UNITS[i] })
                this.setDisbursements(
                  this.state.dateStart,
                  this.state.dateEnd,
                  this.state.disbursement,
                  DISBURSEMENT_UNITS[i],
                )
              }}
            />
          </HorizontalContainer>
        }
      />
    </VerticalContainer>
  )

  oneTimeMerit = () => (
    <VerticalContainer>
      <FormField
        required
        label="Total amount"
        input={this.amountWithTokenAndBalance()}
      />
      {this.startAndEndDate()}
    </VerticalContainer>
  )

  fieldsToDisplay = () => {
    const { rewardType } = this.state
    switch (rewardType) {
    case ONE_TIME_DIVIDEND:
      return this.oneTimeDividend()
    case RECURRING_DIVIDEND:
      return this.recurringDividend()
    case ONE_TIME_MERIT:
      return this.oneTimeMerit()
    default:
      return <div />
    }
  }

  errorBlocks = () => {
    const { semanticErrors, messages } = this.state
    return semanticErrors.map((error, i) => (
      <ErrorText key={i}>
        <IconContainer>
          <IconClose
            size="tiny"
            css={{
              marginRight: '8px',
              color: this.props.theme.negative,
            }}
          />
        </IconContainer>
        <Text>{messages[error]}</Text>
      </ErrorText>
    ))
  }

  warningBlocks = () => {
    const { warnings, messages } = this.state
    return warnings.map((warning, i) => (
      <ErrorText key={i}>
        <IconContainer>
          <IconCaution
            size="tiny"
            css={{
              marginRight: '8px',
              color: this.props.theme.warningSurfaceContent,
            }}
          />
        </IconContainer>
        <Text>{messages[warning]}</Text>
      </ErrorText>
    ))
  }

  showDraft = () => {
    const { rewardType } = this.state
    return (
      <Form
        onSubmit={this.submitDraft}
        submitText="Continue"
        disabled={!this.isDraftValid()}
        errors={
          <React.Fragment>
            { this.errorBlocks() }
            { this.warningBlocks() }
          </React.Fragment>
        }
      >
        <VerticalSpace />
        <FormField
          label="Description"
          required
          input={
            <TextInput
              name="description"
              wide
              multiline
              placeholder="Briefly describe this reward."
              value={this.state.description}
              onChange={e => this.setState({ description: e.target.value })}
            />
          }
        />
        <FormField
          required
          wide
          label="Reference Asset"
          help="hey"
          input={
            <DropDown
              name="referenceAsset"
              wide
              items={this.state.referenceAssets}
              selected={this.state.referenceAssets.indexOf(this.state.referenceAsset)}
              placeholder="Select a token"
              onChange={async (i) => {
                const referenceAsset = this.state.referenceAssets[i]
                this.setState({ referenceAsset })
                if (referenceAsset !== OTHER)
                  await this.verifyTransferable(this.props.app, referenceAsset.key)
                this.setSemanticErrors({ referenceAsset })
              }}
            />
          }
        />
        {this.state.referenceAsset === OTHER && (
          <React.Fragment>
            <FormField
              label={this.onMainNet() ? this.state.labelCustomToken : 'TOKEN ADDRESS'}
              required
              input={
                <TextInput
                  name="customToken"
                  placeholder={this.onMainNet() ? 'SYM…' : ''}
                  wide
                  value={this.state.customToken.value}
                  onChange={this.handleCustomTokenChange}
                />
              }
            />
          </React.Fragment>
        )}
        <FormField
          required
          label="Type"
          input={
            <DropDown
              wide
              name="rewardType"
              items={REWARD_TYPES}
              selected={REWARD_TYPES.indexOf(rewardType)}
              placeholder="Select type of reward"
              onChange={i => {
                this.setState({ rewardType: REWARD_TYPES[i] })
                this.setSemanticErrors({ rewardType: REWARD_TYPES[i] })
              }}
            />
          }
        />
        {this.fieldsToDisplay()}
      </Form>
    )
  }

  showSummary = () => {
    const {
      description,
      rewardType,
      referenceAsset,
      customToken,
      amount,
      amountToken,
      dateReference,
      dateStart,
      dateEnd,
      disbursements,
    } = this.state
    return (
      <VerticalContainer>
        <VerticalSpace />
        <GreyBox>
          <Title>{description}</Title>
          <SubTitle>{rewardType}</SubTitle>
          <Heading>Reference Asset</Heading>
          <Content>
            {referenceAsset === OTHER ? (
              <IdentityBadge
                badgeOnly
                entity={customToken.address}
                shorten
              />
            ): referenceAsset}
          </Content>
          <Heading>
            {rewardType === ONE_TIME_MERIT && 'Total'}
            {' Amount '}
            {rewardType === RECURRING_DIVIDEND && 'per Cycle'}
          </Heading>
          <Content>{amount} {amountToken.symbol}</Content>
          <Heading>
            {rewardType === ONE_TIME_MERIT ?
              'Start and End Date' : 'Disbursement Date'}
            {rewardType === RECURRING_DIVIDEND && 's'}
          </Heading>
          {rewardType === ONE_TIME_DIVIDEND && (
            <Content>{dateReference.toDateString()}</Content>
          )}
          {rewardType === RECURRING_DIVIDEND &&
             disbursements.map((disbursement, i) => (
               <Content key={i}>
                 {disbursement.toDateString()}
               </Content>
             ))}
          {rewardType === ONE_TIME_MERIT && (
            <Content>
              {dateStart.toDateString()}{' - '}{dateEnd.toDateString()}
            </Content>
          )}
        </GreyBox>
        <VerticalSpace />
        <Info>
          {rewardType === ONE_TIME_MERIT ?  'Earning the reference asset between the start and end date'
            : 'Holding the reference asset at the disbursement date'
            + (rewardType === 'RECURRING_DIVIDEND' ? 's' : '')
          }

          {' will issue a proportionally split reward across all token holders.'}
        </Info>
        <VerticalSpace />
        <HorizontalContainer>
          <Button
            label="Go back"
            mode="normal"
            css={{ fontWeight: 700, marginRight: '4px' }}
            onClick={() => this.setState({ draftSubmitted: false })}
            wide
          />
          <Button
            label="Submit"
            mode="strong"
            css={{ fontWeight: 700, marginLeft: '4px' }}
            wide
            onClick={this.onSubmit}
          />
        </HorizontalContainer>
      </VerticalContainer>
    )
  }

  render = () => {
    return this.state.draftSubmitted ? this.showSummary() : this.showDraft()
  }
}

const DisbursementInput = styled(TextInput)`
  border-radius: 4px 0 0 4px;
  box-shadow: none;
`

const VerticalContainer = styled.div`
  display: flex;
  flex-direction: column;
`
const HorizontalContainer = styled.div`
  display: flex;
  justify-content: space-between;
`
const VerticalSpace = styled.div`
  height: 24px;
`
const GreyBox = styled.div`
  background-color: #f9fafc;
  border: 1px solid #dde4e9;
  padding: 24px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
`
const Title = styled(Text).attrs({
  size: 'xlarge',
})``
const SubTitle = styled(Text).attrs({
  size: 'xsmall',
})`
  color: #637381;
  margin-bottom: 8px;
`
const Heading = styled(Text).attrs({
  smallcaps: true,
})`
  color: #637381;
  margin-top: 16px;
  margin-bottom: 8px;
`
const Content = styled(Text).attrs({})``
const ErrorText = styled.div`
  font-size: small;
  display: flex;
  align-items: center;
`
const IconContainer = styled.div`
  display: flex;
`

const NewReward = props => {
  const theme = useTheme()
  return <NewRewardClass theme={theme} {...props} />
}

export default NewReward
