import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { Info, Text, theme, SafeLink, IconFundraising, IconCheck, IconTime, SidePanelSplit, Button } from '@aragon/ui'

import { FieldTitle } from '../../Form'
import { DateInput, InputDropDown } from '../../../../../../shared/ui'
import { format } from 'date-fns'

const rewardTypes = [ 'Merit Reward', 'Dividend' ]
const referenceAssets = [ 'ABC', 'XYZ' ]
const currencies = [ 'ETH', 'DAI' ]
const disbursementCycles = ['Quarterly']
const disbursementCyclesSummary = ['quartery cycle']
const disbursementDates = [ '1 week', '2 weeks' ]
const disbursementDatesItems = disbursementDates.map(item => 'Cycle end + ' + item)

const translateToken = (token) => {
  if (token == 0x0) {
    return 'ETH'
  }
}

class YourReward extends React.Component {
  static propTypes = {
    vaultBalance: PropTypes.string.isRequired,
    onClaimReward: PropTypes.func.isRequired,
    onClosePanel: PropTypes.func.isRequired,
  }

  onClosePanel = () => this.props.onClosePanel()

  onClaimReward = reward => this.props.onClaimReward(reward)

  formatDate = date => format(new Date(date), 'dd-MMM-yyyy')

  render() {
    const {
      creator,
      isMerit,
      referenceToken,
      rewardToken,
      amount,
      startDate,
      endDate,
      description,
      delay,
      claimed,
    } = this.props.reward

    return (
      <div>
        <SidePanelSplit>
          <div>
            <FieldTitle>Origin</FieldTitle>
            <SafeLink
              href="#"
              target="_blank"
              style={{ textDecoration: 'none', color: '#21AAE7' }}
            >
              Reward #2
            </SafeLink>
          </div>
          <div>
            <FieldTitle>Status</FieldTitle>

            {claimed ? (
              <div>
                <IconCheck /> Claimed
              </div>
            ) : (
              <div style={{ color: '#D2C558' }}>
                <IconTime foreground="#D2C558" /> Unclaimed
              </div>
            )}
          </div>
        </SidePanelSplit>

        <Text.Block>Reward summary</Text.Block>

        <Info>
          <TokenIcon />
          <Summary>
            <p>
              You have been granted a one-time <SummaryBold>{amount} {translateToken(rewardToken)}</SummaryBold> reward, based on the <SummaryBold>{referenceToken}</SummaryBold> you earned from <SummaryBold>{this.formatDate(startDate)}</SummaryBold> to <SummaryBold>{this.formatDate(endDate)}</SummaryBold>.
            </p>
            <p>
              For more details, refer to the origin contract, <SafeLink
                href="#"
                target="_blank"
                style={{ textDecoration: 'none', color: '#21AAE7' }}
              >
                Reward #2
              </SafeLink>
            </p>
          </Summary>
        </Info>

        {claimed ? (
          <Button mode="strong" wide onClick={this.onClosePanel}>Close</Button>
        ) : (
          <Button mode="strong" wide onClick={this.onClaimReward}>Claim Reward</Button>
        )}
      </div>
    )
  }
}

const Summary = styled.div`
  margin-bottom: 10px;
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
const TokenIcon = styled(IconFundraising)`
  float: left;
`
export default YourReward
