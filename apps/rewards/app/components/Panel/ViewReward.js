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
} from '@aragon/ui'
import { ETH_DECIMALS } from '../../utils/constants'


const reward = {
  creator: '0xb4124cEB3451635DAcedd11767f004d8a28c6eE7',
  isMerit: true,
  referenceToken: 'SDN',
  rewardToken: 0x0,
  amount: BigNumber(17e18),
  startDate: new Date('December 17, 2018'),
  endDate: new Date('January 17, 2018'),
  description: 'Q1 Reward for Space Decentral Contributors',

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
        description
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
                Pending dev work
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
                {amount.div(ETH_DECIMALS).dp(3).toString()}{' '}{translateToken(rewardToken)}
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

export default ViewReward
