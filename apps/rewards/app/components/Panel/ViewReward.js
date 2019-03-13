import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import Blockies from 'react-blockies'
import { BigNumber } from 'bignumber.js'
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
} from '@aragon/ui'
import { MONTHS } from '../../utils/constants'
import { displayCurrency } from '../../utils/helpers'


const reward = {
  creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  isMerit: true,
  referenceToken: 'SDN',
  rewardToken: 0x0,
  amount: BigNumber(17e18),
  startDate: new Date('December 17, 2018'),
  endDate: new Date('January 17, 2019'),
  description: 'Q1 Reward for Space Decentral Contributors',
  delay: 0

}



class ViewReward extends React.Component {
    static propTypes = {
      reward: PropTypes.object,
    }
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
      } = reward
      const truncatedCreator = `${creator.slice(0, 6)}...${creator.slice(-4)}`
      const translateToken = (token) => {
        if (token == 0x0) {
          return 'ETH'
        }
      }
      return (
        <div>
          <SidePanelSplit>
            <div>
              <h2>
                <Label>Created by</Label>
              </h2>
              <Creator>
                <CreatorImg>
                  <Blockies seed={creator} size={8} />
                </CreatorImg>
                <div>
                  <p>
                    {/* // TODO: Change to etherscanUrl constant for the selected network*/}
                    <SafeLink
                      href={`https://rinkeby.etherscan.io/address/${creator}`}
                      target="_blank"
                      title={creator}
                    >
                      {truncatedCreator}
                    </SafeLink>
                  </p>
                </div>
              </Creator>
            </div>
            <div>
              <h2>
                <Label>Status</Label>
              </h2>
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
                <h2>
                  <Label>Description:</Label>
                </h2>
                <p>{this.renderDescription(description)}</p>
              </React.Fragment>
            </Part>
          )}
          <SidePanelSplit>
            <div>
              <h2>
                <Label>Reference Asset</Label>
              </h2>
              <p>{referenceToken}</p>
            </div>
            <div>
              <h2>
                <Label>Type</Label>
              </h2>
              <div>
                {isMerit?'Merit Reward':'Dividend Reward'}
              </div>
            </div>
          </SidePanelSplit>
          <SidePanelSplit>
            <div>
              <h2>
                <Label>Amount</Label>
              </h2>
              <p>
                {displayCurrency(amount)}{' '}{translateToken(rewardToken)}
              </p>
            </div>
            <div>
              <h2>
                <Label>Period</Label>
              </h2>
              <div>
                {Intl.DateTimeFormat().format(startDate)}
                {' - '}
                {Intl.DateTimeFormat().format(endDate)}
              </div>
            </div>
          </SidePanelSplit>
          <Part>
            <Text size='large' weight='bold' >Reward Summary</Text>
          </Part>
          <Info>
            <TokenIcon />
            <Summary>
              <p>
                {'A total of '}
                <SummaryVar>{displayCurrency(amount)} {translateToken(rewardToken)}</SummaryVar>
                {' will be distributed as a reward to addresses that earned '}
                <SummaryVar>{referenceToken}</SummaryVar>
                {' from '}
                <SummaryVar>
                  {startDate.getDate().toString() + '-' + MONTHS[startDate.getMonth()] + '-' + startDate.getFullYear()}
                </SummaryVar>
                {' to '}
                <SummaryVar>
                  {endDate.getDate().toString() + '-' + MONTHS[endDate.getMonth()] + '-' + endDate.getFullYear()}
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
  padding-left: 10%;
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

export default ViewReward
