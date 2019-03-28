import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Blockies from 'react-blockies'
import { BigNumber } from 'bignumber.js'
import { format } from 'date-fns'
import {
  Badge,
  Button,
  Info,
  SafeLink,
  SidePanelSplit,
  SidePanelSeparator,
  Countdown,
  Text,
  theme,
  IconTime,
  IconCheck,
  IconFundraising,
  IdentityBadge,
} from '@aragon/ui'
import { FieldTitle, FormField } from '../../Form'
import { MONTHS } from '../../../utils/constants'
import { displayCurrency } from '../../../utils/helpers'
import { provideNetwork } from '../../../../../../shared/ui'

class ViewReward extends React.Component {
    static propTypes = {
      reward: PropTypes.object,
      network: PropTypes.object,
    }

    onClosePanel = () => this.props.onClosePanel()

    renderDescription = (description = '') => {
      // Make '\n's real breaks
      return description.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line}
          <br />
        </React.Fragment>
      ))
    }
    render() {
      const { network } = this.props
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
      } = this.props.reward

      const translateToken = (token) => {
        if (token == 0x0) {
          return 'ETH'
        }
      }
      return (
        <div>
          <SidePanelSplit>
            <div>
              <FieldTitle>Created by</FieldTitle>
              <Creator>
                <CreatorImg>
                  <Blockies seed={creator} size={8} />
                </CreatorImg>
                <div>
                  <p>
                    <IdentityBadge
                      networkType={network.type}
                      entity={creator}
                      shorten={true}
                    />
                  </p>
                </div>
              </Creator>
            </div>
            <div>
              <FieldTitle>Status</FieldTitle>
              <div>
                {
                  (
                    Date.now() > endDate
                  ) ? (
                      <div>
                        <IconCheck /> Available
                      </div>
                    ) : (
                      <div>
                        <IconTime /> Pending
                      </div>
                    )
                }
              </div>
            </div>
          </SidePanelSplit>
          {description && (
            <Part>
              <React.Fragment>
                <FieldTitle>Description</FieldTitle>
                <p>{this.renderDescription(description)}</p>
              </React.Fragment>
            </Part>
          )}
          <SidePanelSplit>
            <div>
              <FieldTitle>Reference Asset</FieldTitle>
              <p>{referenceToken}</p>
            </div>
            <div>
              <FieldTitle>Type</FieldTitle>
              <div>
                {isMerit?'Merit Reward':'Dividend Reward'}
              </div>
            </div>
          </SidePanelSplit>
          <SidePanelSplit style={{ borderTop: '0' }}>
            <div>
              <FieldTitle>Amount</FieldTitle>
              <p>
                {displayCurrency(amount)}{' '}{translateToken(rewardToken)}
              </p>
            </div>
            <div>
              <FieldTitle>Period</FieldTitle>
              <div>
                {Intl.DateTimeFormat().format(startDate)}
                {' - '}
                {Intl.DateTimeFormat().format(startDate)}
              </div>
            </div>
          </SidePanelSplit>
          <Part>
            <Text size='large' weight='bold' >Reward Summary</Text>
          </Part>
          <Info style={{ marginBottom: '10px' }}>
            <TokenIcon />
            <Summary>
              <p>
                {'A total of '}
                <SummaryVar>{displayCurrency(amount)} {translateToken(rewardToken)}</SummaryVar>
                {' will be distributed as a reward to addresses that earned '}
                <SummaryVar>{referenceToken}</SummaryVar>
                {' from '}
                <SummaryVar>
                  {format(startDate,'dd-MMM-yyyy')}
                </SummaryVar>
                {' to '}
                <SummaryVar>
                  {format(endDate,'dd-MMM-yyyy')}
                </SummaryVar>
                {'.'}
              </p>
              <p>
                {'The reward amount will be in proportion to the '}
                <SummaryVar>{referenceToken}</SummaryVar>
                {' earned by each account in the specified period.'}
              </p>
              <p>
                {'The reward will be dispersed '}
                <SummaryVar>
                  {delay === 0?'immediately': (delay + ' day' + (delay > 1 ? 's' : ''))}
                </SummaryVar>
                {' after the end of the period.'}
              </p>
            </Summary>
          </Info>
          <Button mode="strong" wide onClick={this.onClosePanel}>Close</Button>
        </div>
      )
    }
}

const Label = styled(Text).attrs({
  smallcaps: true,
  color: theme.textSecondary,
})`
  display: block;
  margin-bottom: 10px;
`

const Creator = styled.div`
  display: flex;
  align-items: center;
`
const CreatorImg = styled.div`
  margin-right: 20px;
  canvas {
    display: block;
    border: 1px solid ${theme.contentBorder};
    border-radius: 16px;
  }
  & + div {
    a {
      color: ${theme.accent};
    }
  }
`

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
  padding: 0px;
  padding-left: 35px;
  p {
    padding-block-end: 11pt;
  }
  p:last-of-type {
    padding-block-end: 0px;
  }
`
const SummaryVar = styled.span`
  font-weight: bold;
  text-decoration: underline;
`
const TokenIcon = styled(IconFundraising)`
float: left;
`

export default provideNetwork(ViewReward)
