import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Info, Text, TextInput, theme, SafeLink, DropDown } from '@aragon/ui'

import { Form, FormField } from '../../Form'
import { DateInput, InputDropDown } from '../../../../../../shared/ui'
import { format } from 'date-fns'

const rewardTypes = [ 'Merit Reward', 'Dividend' ]
const referenceAssets = [ 'ABC', 'XYZ' ]
const currencies = [ 'ETH', 'DAI' ]
const disbursementCycles = ['Quarterly']
const disbursementCyclesSummary = ['quartery cycle']
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
  }

  changeField = ({ target: { name, value } }) =>
    this.setState({ [name]: value })
  
  onSubmit = () => {
    const dataToSend = this.state
    dataToSend.currency = currencies[this.state.amountCurrency]
    dataToSend.disbursementCycle = disbursementCycles[this.state.disbursementCycle]
    dataToSend.disbursementDate = disbursementDates[this.state.disbursementDate]

    console.log('Submitting new reward: ', dataToSend)
    this.props.onNewReward(dataToSend)
  }

  canSubmit = () =>
    !(
      this.state.amount > 0 &&
      this.state.description !== ''
    )

  formatDate = date => format(date, 'yyyy-MM-dd')

  rewardMain = () => (
    <div>
      <RewardRow>
        <FormField
          required
          label="Reference Asset"
          width="180px"
          input={
            <DropDown
              wide
              items={referenceAssets}
              active={this.state.referenceAsset}
              onChange={referenceAsset => this.setState({ referenceAsset })}
            />
          }
        />
        <FormField
          required
          label="Type"
          width="180px"
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
          width="180px"
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
                items: currencies,
                active: this.state.amountCurrency,
                onChange: amountCurrency => this.setState({ amountCurrency }),
              }}
            />
          }
        />
        <VaultBalance>
          Vault Balance: {this.props.vaultBalance}
        </VaultBalance>
      </RewardRow>

      <RewardRow>
        <FormField
          label="Period Start"
          required
          input={
            <DateInput
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
              name="periodEnd"
              value={this.state.dateEnd}
              onChange={dateEnd => this.setState({ dateEnd })}
            />
          }
        />
      </RewardRow>

      <Separator />

      <Summary>
        <p>
          A total of <SummaryBold>{this.state.amount} {currencies[this.state.amountCurrency]}</SummaryBold> will be distributed as a reward to addresses that earned <SummaryBold>{referenceAssets[this.state.referenceAsset]}</SummaryBold> from <SummaryBold>{this.formatDate(this.state.dateStart)}</SummaryBold> to <SummaryBold>{this.formatDate(this.state.dateEnd)}</SummaryBold>.
        </p>
        <p>
          The reward amount will be in proportion to the <SummaryBold>{referenceAssets[this.state.referenceAsset]}</SummaryBold> earned by each account in the specified period. 
        </p>
        <p>
          The reward will be disbursed <SafeLink href="#" target="_blank"><SummaryBold>upon approval of this proposal</SummaryBold></SafeLink>.
        </p>
      </Summary>
    </div>
  )

  dividendDetails = () => (
    <div>
      <RewardRow>
        <FormField
          required
          label="Amount per cycle"
          width="180px"
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
                items: currencies,
                active: this.state.amountCurrency,
                onChange: amountCurrency => this.setState({ amountCurrency }),
              }}
            />
          }
        />
        <VaultBalance>
          Vault Balance: {this.props.vaultBalance}
        </VaultBalance>
      </RewardRow>

      <RewardRow>
        <FormField
          label="Start date"
          required
          input={
            <DateInput
              name="dateStart"
              value={this.state.dateStart}
              onChange={dateStart => this.setState({ dateStart })}
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
              onChange={dateEnd => this.setState({ dateEnd })}
            />
          }
        />
      </RewardRow>

      <RewardRow>
        <FormField
          required
          label="Disbursement cycle"
          width="180px"
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

      <Summary>
        <p>
          A total of <SummaryBold>{this.state.amount} {currencies[this.state.amountCurrency]}</SummaryBold> will be distributed as a dividend to <SummaryBold>{referenceAssets[this.state.referenceAsset]}</SummaryBold> holders on a <SummaryBold>{disbursementCyclesSummary[this.state.disbursementCycle]}</SummaryBold>, from <SummaryBold>{this.formatDate(this.state.dateStart)}</SummaryBold> to <SummaryBold>{this.formatDate(this.state.dateEnd)}</SummaryBold>.
        </p>
        <p>
          The dividend amount will be in proportion to the <SummaryBold>{referenceAssets[this.state.referenceAsset]}</SummaryBold> balance as of the last day of the cycle.
        </p>
        <p>
          The dividend will be disbursed <SummaryBold>{disbursementDates[this.state.disbursementDate]}</SummaryBold> after the end of each cycle..
        </p>
      </Summary>
    </div>
  )


  render() {
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
const Summary = styled(Info)`
  margin-bottom: 10px;
  padding-bottom: 2px;
  > :not(:last-child) {
    margin-bottom: 10px;
  }
`
const SummaryBold = styled.span`
  font-weight: bold;
  text-decoration: underline;
`
const RewardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-content: stretch;
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
export default NewReward
