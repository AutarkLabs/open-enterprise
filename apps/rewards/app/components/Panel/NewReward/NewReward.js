import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import {
  DropDown,
  IconClose,
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
  DISBURSEMENT_UNITS,
  MONTHS,
  OTHER,
} from '../../../utils/constants'
import RewardSummary from '../RewardSummary'

import tokenBalanceOfAbi from '../../../../../shared/json-abis/token-balanceof.json'
import tokenBalanceOfAtAbi from '../../../../../shared/json-abis/token-balanceofat.json'
import tokenCreationBlockAbi from '../../../../../shared/json-abis/token-creationblock.json'
import tokenSymbolAbi from '../../../../../shared/json-abis/token-symbol.json'

const tokenAbi = [].concat(tokenBalanceOfAbi, tokenBalanceOfAtAbi, tokenCreationBlockAbi, tokenSymbolAbi)

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
  dateReference: new Date(),
  dateStart: new Date(),
  dateEnd: new Date(),
  disbursement: '',
  disbursementUnit: MONTHS,
  disbursements: [],
  draftSubmitted: false,
  semanticErrors: [],
  errorMessages: {
    customTokenInvalid: 'Token address must be of a valid ERC20 compatible clonable token.',
    amountOverBalance: 'Amount must be below the available balance.',
    dateReferencePassed: 'Reference date must take place after today.',
    dateStartPassed: 'Start date must take place after today.',
    dateEndPassed: 'End date must take place after today.',
    dateStartAfterEnd: 'Start date must take place before the end date.',
    disbursementsInexistent: 'Disbursement frequency does not output any disbursements for the given time range.',
  }
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
    let semanticErrors = []
    if (state.referenceAsset === OTHER && !state.customToken.isVerified)
      semanticErrors.push('customTokenInvalid')
    if (+state.amount > +state.amountToken.balance)
      semanticErrors.push('amountOverBalance')
    const today = moment()
    if (state.rewardType === ONE_TIME_DIVIDEND &&
        moment(state.dateReference).isBefore(today, 'day'))
      semanticErrors.push('dateReferencePassed')
    if (state.rewardType === RECURRING_DIVIDEND ||
        state.rewardType === ONE_TIME_MERIT) {
      const start = moment(state.dateStart), end = moment(state.dateEnd)
      if (start.isBefore(today, 'day'))
        semanticErrors.push('dateStartPassed')
      if (end.isBefore(today, 'day'))
        semanticErrors.push('dateEndPassed')
      if (start.isAfter(end, 'day'))
        semanticErrors.push('dateStartAfterEnd')
    }
    if (state.rewardType === RECURRING_DIVIDEND &&
        state.disbursements.length <= 1)
      semanticErrors.push('disbursementsInexistent')
    this.setState({ semanticErrors })
  }

  onMainNet = () => this.props.network.type === 'main'

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
        this.setState({ customToken: { ...tokenState, isVerified: false } })
        return false
      }
      this.setState({
        customToken: {
          ...tokenState,
          isVerified: true,
          symbol: await token.symbol().toPromise(),
          startBlock: await token.creationBlock().toPromise(),
        }
      })
      return true
    }
    catch (error) {
      this.setState({ customToken: { ...tokenState, isVerified: false } })
      return false
    }
  }

  amountWithTokenAndBalance = () => {
    const { amountTokens } = this.props
    const { amountToken } = this.state
    return (
      <VerticalContainer>
        <HorizontalContainer>
          <TextInput
            name="amount"
            type="number"
            min={MIN_AMOUNT}
            step="any"
            onChange={e => {
              const { value } = e.target
              this.setState({ amount: value })
              this.setSemanticErrors({ amount: value })
            }}
            wide={true}
            value={this.state.amount}
            css={{ borderRadius: '4px 0px 0px 4px' }}
          />
          <DropDown
            name="amountToken"
            css={{ borderRadius: '0px 4px 4px 0px' }}
            items={amountTokens.map(token => token.symbol)}
            selected={amountTokens.indexOf(amountToken)}
            onChange={i => {
              this.setState({ amountToken: amountTokens[i] })
              this.setSemanticErrors({ amountToken: amountTokens[i] })
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
          {this.state.amountToken.balance} {this.state.amountToken.symbol}
        </Text>
      </VerticalContainer>
    )
  }

  startAndEndDate = () => (
    <HorizontalContainer>
      <FormField
        label="Start date"
        required
        input={
          <DateInput
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
              this.setState({ dateReference })
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
            <TextInput
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
              css={{ borderRadius: '4px 0px 0px 4px' }}
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
    const { semanticErrors, errorMessages } = this.state
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
        <Text>{errorMessages[error]}</Text>
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
        errors={this.errorBlocks()}
      >
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
              onChange={i => {
                this.setState({ referenceAsset: this.state.referenceAssets[i] })
                this.setSemanticErrors({
                  referenceAsset: this.state.referenceAssets[i]
                })
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


  render = () => {
    const { draftSubmitted } = this.state
    const { theme } = this.props
    if (draftSubmitted) {
      return (
        <RewardSummary
          reward={this.state}
          theme={theme}
          onCancel={() => this.setState({ draftSubmitted: false })}
          onSubmit={this.onSubmit}
        />
      )
    }
    else {
      return this.showDraft()
    }
  }
}

const VerticalContainer = styled.div`
  display: flex;
  flex-direction: column;
`
const HorizontalContainer = styled.div`
  display: flex;
  justify-content: space-between;
`
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
