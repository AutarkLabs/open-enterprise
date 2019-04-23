import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Info, Text, TextInput, theme, SafeLink, DropDown, IconFundraising } from '@aragon/ui'

import { Form, FormField } from '../../Form'
import { DateInput, InputDropDown } from '../../../../../../shared/ui'
import { format } from 'date-fns'
import BigNumber from 'bignumber.js'
import { millisecondsToBlocks, millisecondsToQuarters, MILLISECONDS_IN_A_QUARTER } from '../../../../../../shared/ui/utils'
import { displayCurrency, toCurrency } from '../../../utils/helpers'

const rewardTypes = [ 'Merit Reward', 'Dividend' ]
const referenceAssets = [ 'ABC', 'XYZ' ]
const currencies = [ 'ETH', 'DAI' ]
const disbursementCycles = ['Quarterly']
const disbursementCyclesSummary = ['quarterly cycle']
const disbursementDates = [ '1 week', '2 weeks' ]
const disbursementDatesItems = disbursementDates.map(item => 'Cycle end + ' + item)

class NewReward extends React.Component {
  static propTypes = {
    vaultBalance: PropTypes.string.isRequired,
    onNewReward: PropTypes.func.isRequired,
  }

  state = {
    description: '',
    amount: 0,
    amountCurrency: 0,
    dateStart: new Date(),
    dateEnd: new Date(),
    rewardType: 0,
    referenceAsset: 0,
    disbursementCycle: 0,
    disbursementDate: 0,
    occurances: 0,
  }

  changeField = ({ target: { name, value } }) =>
    this.setState({ [name]: value })

  onSubmit = () => {
    const dataToSend = { ...this.state }
    dataToSend.amount = toCurrency(this.state.amount,this.props.balances[this.state.amountCurrency].decimals)
    dataToSend.currency = this.props.balances[this.state.amountCurrency].address
    dataToSend.disbursementCycle = disbursementCycles[this.state.disbursementCycle]
    dataToSend.disbursementDelay = disbursementDates[this.state.disbursementDate]
    dataToSend.isMerit = !dataToSend.rewardType ? true : false
    dataToSend.referenceAsset = this.props.balances[this.state.referenceAsset+1].address // account for no ETH in reference asset dropdown
    this.props.onNewReward(dataToSend)
  }

  canSubmit = () =>
    !(
      this.state.amount > 0 &&
      this.state.description !== '' &&
      this.state.dateEnd > this.state.dateStart
    )

  formatDate = date => format(date, 'yyyy-MM-dd')
  changeDate = (dateStart, dateEnd) => {
    const occurances = millisecondsToQuarters(dateStart, dateEnd)
    this.setState({
      dateEnd,
      occurances,
      quarterEndDates: [...Array(occurances).keys()]
        .map(occurance => Date.now() + ((occurance + 1) * MILLISECONDS_IN_A_QUARTER)),
    })
  }

  rewardMain = () => (
    <div>
      <RewardRow>
        <FormField
          required
          label="Reference Asset"
          input={
            <DropDown
              wide
              items={this.props.balances.slice(1).map(token => token.name)}
              active={this.state.referenceAsset}
              onChange={referenceAsset => this.setState({ referenceAsset })}
            />
          }
        />
        <FormField
          required
          label="Type"
          input={
            <DropDown
              wide
              items={rewardTypes}
              active={this.state.rewardType}
              onChange={rewardType => this.setState({ rewardType })}
            />
          }
        />
      </RewardRow>
    </div>
  )

  meritDetails = () => (
    <div>
      <RewardRow>
        <FormField
          required
          label="Amount"
          input={
            <InputDropDown
              textInput={{
                name: 'amount',
                value: this.state.amount,
                onChange: this.changeField,
                type: 'number',
                min: '0',
              }}
              dropDown={{
                name: 'amountCurrency',
                items: this.props.balances.map(token => token.symbol),
                active: this.state.amountCurrency,
                onChange: amountCurrency => this.setState({ amountCurrency }),
              }}
            />
          }
        />
        <VaultBalance>
          Vault Balance: {
            BigNumber(this.props.balances[this.state.amountCurrency].amount)
              .div(10**(this.props.balances[this.state.amountCurrency].decimals)).dp(3).toString()
          } {' '} {this.props.balances[this.state.amountCurrency].symbol}
        </VaultBalance>
      </RewardRow>

      <RewardRow>
        <FormField
          label="Period Start"
          required
          input={
            <DateInput
              width="100%"
              name="dateStart"
              value={this.state.dateStart}
              onChange={dateStart => this.setState({ dateStart })}
            />
          }
        />
        <FormField
          label="Period End"
          required
          input={
            <DateInput
              width="100%"
              name="periodEnd"
              value={this.state.dateEnd}
              onChange={dateEnd => this.setState({ dateEnd })}
            />
          }
        />
      </RewardRow>

      <Separator />

      <Info style={{ marginBottom: '10px' }}>
        <TokenIcon />
        <Summary>
          <p>
            A total of <SummaryBold>{this.state.amount} {this.props.balances[this.state.amountCurrency].symbol}</SummaryBold> will be distributed as a reward to addresses that earned <SummaryBold>{this.props.balances[this.state.referenceAsset+1].name}</SummaryBold> from <SummaryBold>{this.formatDate(this.state.dateStart)}</SummaryBold> to <SummaryBold>{this.formatDate(this.state.dateEnd)}</SummaryBold>.
          </p>
          <p>
            The reward amount will be in proportion to the <SummaryBold>{this.props.balances[this.state.referenceAsset+1].name}</SummaryBold> earned by each account in the specified period.
          </p>
          <p>
            The reward will be disbursed <SafeLink href="#" target="_blank"><SummaryBold>upon approval of this proposal</SummaryBold></SafeLink>.
          </p>
        </Summary>
      </Info>
    </div>
  )

  dividendDetails = () => (
    <div>
      <RewardRow>
        <FormField
          required
          label="Amount per cycle"
          input={
            <InputDropDown
              textInput={{
                name: 'amount',
                value: this.state.amount,
                onChange: this.changeField,
                type: 'number',
                min: '0',
              }}
              dropDown={{
                name: 'amountCurrency',
                items: this.props.balances.map(token => token.symbol),
                active: this.state.amountCurrency,
                onChange: amountCurrency => this.setState({ amountCurrency }),
              }}
            />
          }
        />
        <VaultBalance>
          Vault Balance: {
            BigNumber(this.props.balances[this.state.amountCurrency].amount)
              .div(10**(this.props.balances[this.state.amountCurrency].decimals)).dp(3).toString()
          } {' '} {this.props.balances[this.state.amountCurrency].symbol}
        </VaultBalance>
      </RewardRow>

      <RewardRow>
        <FormField
          label="Start date"
          required
          input={
            <DateInput
              width="100%"
              name="dateStart"
              value={this.state.dateStart}
              onChange={dateStart => this.changeDate(dateStart, this.state.dateEnd)}
            />
          }
        />
        <FormField
          label="End date"
          required
          input={
            <DateInput
              width="100%"
              name="dateEnd"
              value={this.state.dateEnd}
              onChange={dateEnd =>this.changeDate(this.state.dateStart,dateEnd)}
            />
          }
        />
      </RewardRow>

      <RewardRow>
        <FormField
          required
          label="Disbursement cycle"
          input={
            <DropDown
              wide
              items={disbursementCycles}
              active={this.state.disbursementCycle}
              onChange={disbursementCycle => this.setState({ disbursementCycle })}
            />
          }
        />
        <FormField
          required
          label="Disbursement date"
          width="180px"
          input={
            <DropDown
              wide
              items={disbursementDatesItems}
              active={this.state.disbursementDate}
              onChange={disbursementDate => this.setState({ disbursementDate })}
            />
          }
        />
      </RewardRow>

      <Separator />
      { this.state.occurances ?
        <Info style={{ marginBottom: '10px' }}>
          <TokenIcon />
          <Summary>
            <p>
              {'A total of '}
              <SummaryBold>
                {this.state.amount} {this.props.balances[this.state.amountCurrency].symbol}
              </SummaryBold>
              {' will be distributed as a dividend to '}
              <SummaryBold>
                {this.props.balances[this.state.referenceAsset+1].name}
              </SummaryBold>
              {' holders on a '}
              <SummaryBold>
                {disbursementCyclesSummary[this.state.disbursementCycle]}
              </SummaryBold>
              {', from '}
              <SummaryBold>
                {this.formatDate(this.state.dateStart)}
              </SummaryBold>
              {' to '}
              <SummaryBold>
                {this.formatDate(this.state.dateEnd)}
              </SummaryBold>
              {'with cycles ending on:'}
              {
                this.state.quarterEndDates.map((endTimeStamp, idx) => (
                  <React.Fragment key={idx}>
                    <br />
                    <SummaryBold>
                      {this.formatDate(endTimeStamp)}
                    </SummaryBold>
                  </React.Fragment>
                ))
              }.
            </p>
            <p>
          The dividend amount will be in proportion to the <SummaryBold>{this.props.balances[this.state.referenceAsset+1].name}</SummaryBold> balance as of the last day of each cycle.
            </p>
            <p>
          The dividend will be disbursed <SummaryBold>{disbursementDates[this.state.disbursementDate]}</SummaryBold> after the end of each cycle.
            </p>
          </Summary>
        </Info>
        :
        <React.Fragment>
          <Info.Alert>
            Please select a start and end date that are at least as long as the cycle period selected
          </Info.Alert>
          <br />
        </React.Fragment>
      }
    </div>
  )


  render() {
    const { dateStart, dateEnd, rewardType, occurances } = this.state
    //if (rewardType === 1) {
    //  console.log('occurances: ', occurances)
    //  console.log('quarter end dates: ', this.state.quarterEndDates)
    //}

    return (
      <Form
        onSubmit={this.onSubmit}
        submitText="Submit Reward"
        noSeparator
        submitDisabled={this.canSubmit()}
      >
        <FormField
          label="Description"
          required
          input={
            <TextInput
              name="description"
              wide
              value={this.state.description}
              onChange={this.changeField}
            />
          }
        />

        <Separator />

        {this.rewardMain()}

        <Separator />

        {this.state.rewardType === 0 ? this.meritDetails() : this.dividendDetails()}

      </Form>
    )
  }
}
const Summary = styled.div`
  padding-bottom: 2px;
  padding-left: 35px;
  > :not(:last-child) {
    margin-bottom: 10px;
  }
`
const SummaryBold = styled.span`
  font-weight: bold;
  text-decoration: underline;
`
// RewardRow is supposed to have only two elements
const RewardRow = styled.div`
  display: flex;
  align-content: stretch;
  > :first-child {
    width: 50%;
    padding-right: 10px;
  }
  > :last-child {
    width: 50%;
    padding-left: 10px;
  }
`
const Separator = styled.hr`
  height: 1px;
  width: 100%;
  color: ${theme.contentBorder};
  opacity: 0.1;
  margin: 8px 0;
`
const VaultBalance = styled.div`
  display: flex;
  align-items: center;
`
const TokenIcon = styled(IconFundraising)`
float: left;
`
export default NewReward
