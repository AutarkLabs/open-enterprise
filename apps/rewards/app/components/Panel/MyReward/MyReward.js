import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { provideNetwork } from '../../../../../../shared/ui'
import { blocksToMilliseconds } from '../../../../../../shared/ui/utils'

import {
  Info,
  Text,
  SafeLink,
  IconFundraising,
  IconCheck,
  IconTime,
  SidePanelSplit,
  Button,
  IdentityBadge,
} from '@aragon/ui'

import { FieldTitle } from '../../Form'
import { format } from 'date-fns'
import { displayCurrency } from '../../../utils/helpers'

const getSymbol = (tokens, rewardToken) => {
  return tokens
    .reduce((symbol, token) => {
      if (token.address === rewardToken) return token.symbol
      else return symbol
    },'')
}

class MyReward extends React.Component {
  static propTypes = {
    onClaimReward: PropTypes.func.isRequired,
    onClosePanel: PropTypes.func.isRequired,
  }

  onClosePanel = () => this.props.onClosePanel()

  onClaimReward = () => this.props.onClaimReward(this.props.reward)

  onViewOrigin = e => {
    this.props.viewReward(this.props.reward)
    e.preventDefault()
  } 

  formatDate = date => Intl.DateTimeFormat().format(date)

  render() {
    const {
      rewardId,
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
      userRewardAmount
    } = this.props.reward
    
    const { tokens } = this.props

    return (
      <div>
        <SidePanelSplit>
          <div>
            <FieldTitle>Origin</FieldTitle>
            <SafeLink
              href="#"
              onClick={this.onViewOrigin}
              style={{ textDecoration: 'none', color: '#21AAE7' }}
            >
            Reward #{rewardId}
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
        <Part>
          <Text size='large' weight='bold' >Reward Summary</Text>
        </Part>
        <Info style={{ marginBottom: '10px' }}>
          <TokenIcon />
          <Summary>
            {isMerit === true ? (
              <p>
                You have been granted a one-time <SummaryBold>{displayCurrency(userRewardAmount)} {getSymbol(tokens,rewardToken)}</SummaryBold> reward, based on the <SummaryBold>{getSymbol(tokens, referenceToken)}</SummaryBold> you earned from <SummaryBold>{this.formatDate(startDate)}</SummaryBold> to <SummaryBold>{this.formatDate(endDate)}</SummaryBold>.
              </p>
            ) : (
              <p>
              A dividend, currently worth <SummaryBold>{displayCurrency(userRewardAmount)} {getSymbol(tokens,rewardToken)}</SummaryBold>, will be distributed to you based on your holdings of <SummaryBold>{getSymbol(tokens, referenceToken)}</SummaryBold> on <SummaryBold>{this.formatDate(endDate)}</SummaryBold>.
              You will be able to claim it after <SummaryBold>{this.formatDate(endDate + blocksToMilliseconds(0,delay))}</SummaryBold>.
              </p>
            )}
            <p>
              {'For more details, refer to the origin, '}
              <SafeLink
                href="#"
                onClick={this.onViewOrigin}
                style={{ textDecoration: 'none', color: '#21AAE7' }}
              >
                Reward #{rewardId}
              </SafeLink>
            </p>
          </Summary>
        </Info>

        {claimed ? (
          <Button mode="strong" wide onClick={this.onClosePanel}>Close</Button>
        ) : (
          Date.now() > endDate ?
            <Button mode="strong" wide onClick={this.onClaimReward}>Claim Reward</Button>
            : null
        )}
      </div>
    )
  }
}

const Part = styled.div`
  padding: 20px 0;
  h2 {
    margin-top: 20px;
    &:first-child {
      margin-top: 0;
    }
  }
`

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
const TokenIcon = styled(IconFundraising)`
  float: left;
`
export default provideNetwork(MyReward)
