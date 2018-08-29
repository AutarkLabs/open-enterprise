import React, { Component } from 'react'
import styled from 'styled-components'

import {
  Card,
  ContextMenu,
  ContextMenuItem,
  IconSettings,
  IconAdd,
  Text,
  theme,
} from '@aragon/ui'

import icon from '../assets/allocation-card-icon.svg'

const { accent, textPrimary, textTertiary } = theme
const contextMenuItems = [
  {
    text: 'New Allocation',
    icon: IconAdd,
    action: 'newAllocation',
    colors: {
      iconColor: textTertiary,
      labelColor: textPrimary,
    },
  },
  {
    text: 'Manage Parameters',
    // TODO: Put the right icon here
    icon: IconSettings,
    action: 'manageParameters',
    colors: { iconColor: accent },
  },
]

class AccountCard extends Component {
  static defaultProps = {
    balance: 0,
    description: '',
    openSidePanel: () => {},
  }

  newAllocation = () => {
    this.props.openSidePanel(this.props.description)
  }

  manageParameters = () => {
    console.log('manageParameters clicked')
  }

  loadContextMenu = contextMenuItems.map(
    ({ text, action, colors, icon: Icon }) => (
      <StyledMenuItem key={text} onClick={this[action]} colors={colors}>
        <Icon />
        {text}
      </StyledMenuItem>
    )
  )

  render() {
    return (
      <StyledCard>
        <MenuContainer>
          <ContextMenu>{this.loadContextMenu}</ContextMenu>
        </MenuContainer>
        <IconContainer>
          <img src={icon} alt={`${this.props.description} icon`} />
        </IconContainer>
        <CardTitle size="large" color={textPrimary}>
          {this.props.description}
        </CardTitle>
        <CardAddress size="small" color="#4A90E2">
          {this.props.address.slice(0, 6) +
            '...' +
            this.props.address.slice(-4)}
        </CardAddress>
        <StatsContainer>
          <StatsTitle>Balance</StatsTitle>
          <StatsValue>
            {this.props.balance} {this.props.token}
          </StatsValue>
        </StatsContainer>
        <StatsContainer>
          <StatsTitle>Limit</StatsTitle>
          <StatsValue>
            {this.props.limit} {this.props.token}/ Payout
          </StatsValue>
        </StatsContainer>
      </StyledCard>
    )
  }
}

const StyledCard = styled(Card)`
  height: 300px;
  width: 300px;
`

const MenuContainer = styled.div`
  float: right;
  margin-top: 1rem;
  margin-right: 1rem;
`

const CardTitle = styled(Text)`
  display: block;
  text-align: center;
  font-weight: bold;
  font-size: 20px;
`

const CardAddress = styled(Text)`
  display: block;
  width: 300px;
  text-align: center;
  text-decoration: underline;
  cursor: pointer;
  text-overflow: ellipsis;
`

const IconContainer = styled.div`
  margin-top: 4rem;
  margin-left: 110px;
`

const StatsContainer = styled.div`
  width: 50%;
  display: inline-block;
  margin-top: 3rem;
  padding-left: 1rem;
`

const StatsTitle = styled.p`
  color: #6d777b;
  font-size: 16px;
  text-transform: lowercase;
  font-variant: small-caps;
`

const StatsValue = styled.p`
  font-size: 14px;
`

const StyledMenuItem = styled(ContextMenuItem).attrs({
  iconColor: props => props.colors.iconColor || textPrimary,
  labelColor: props => props.colors.labelColor || props.colors.iconColor,
})`
  color: ${props => props.labelColor};
  font-weight: bold;
  width: 248px;
  & > :first-child {
    margin-right: 15px;
    color: ${props => props.iconColor};
  }
`

export default AccountCard
