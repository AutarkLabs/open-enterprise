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

const initialState = {
  contextMenuItems: [
    {
      text: 'New Allocation',
      icon: IconAdd,
      function: 'openNewPayoutVote',
      colors: {
        iconColor: textTertiary,
        labelColor: textPrimary,
      },
    },
    {
      text: 'Manage Parameters',
      icon: IconSettings,
      function: 'openManageParemeters',
      colors: { iconColor: accent },
    },
  ],
}

class AllocationCard extends Component {
  state = {
    ...initialState,
  }

  openNewPayoutVote = () => {
    if (typeof this.props.openSidePanelLink === 'function') {
      this.props.openSidePanelLink()
    } else {
      console.info(
        'AllocationCard component: openSidePanelLink not defined, click has no effect'
      )
    }
  }

  openManageParemeters = () => {}

  render() {
    const {
      metadata,
      description,
      balance,
      limit,
      token,
      proxy,
    } = this.props.data
    let tokenLabel
    // Hardcoded token lookup for eth and possibly others?
    switch (parseInt(token)) {
    case 0:
      tokenLabel = 'ETH'
      break
    }
    const { contextMenuItems } = this.state
    const menuElements = contextMenuItems.map(item => (
      <StyledMenuItem
        key={item.text}
        onClick={this[item.function]} // this[item.handler]
        colors={item.colors}
      >
        {React.createElement(item.icon)}
        {item.text}
      </StyledMenuItem>
    ))

    return (
      <StyledCard>
        <MenuContainer>
          <ContextMenu>{menuElements}</ContextMenu>
        </MenuContainer>
        <IconContainer>
          <img src={icon} alt={`${metadata} icon`} />
        </IconContainer>
        <CardTitle size="large" color={textPrimary}>
          {metadata}
        </CardTitle>
        <CardAddress size="small" color="#4A90E2">
          {proxy.slice(0, 6) + '...' + proxy.slice(-4)}
        </CardAddress>
        <StatsContainer>
          <StatsTitle>Balance</StatsTitle>
          <StatsValue>
            {balance} {tokenLabel}
          </StatsValue>
        </StatsContainer>
        <StatsContainer>
          <StatsTitle>Limit</StatsTitle>
          <StatsValue>
            {limit} {tokenLabel}/ Allocation
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

const StyledCardtest = styled(Card)`
  height: 312px;
  width: 280px;
  display: grid;
  grid-template-columns: repeat(4, 25%);
  grid-template-areas:
    '.    icon icon menu'
    '.    icon icon .   '
    'labl labl labl labl'
    'desc desc desc desc'
    'sta1 sta1 sta2 sta2'
    'val1 val1 val2 val2'
    'addr addr .    .   ';
  grid-gap: 12px 0;

  & > :nth-child(1) {
    grid-area: menu;
    margin-left: 10px;
    margin-top: 10px;
  }
  & > :nth-child(2) {
    grid-area: icon;
    justify-self: center;
    padding-top: 30px;
  }
  & > :nth-child(3) {
    grid-area: labl;
    justify-self: center;
    font-weight: bold;
  }
  & > :nth-child(4) {
    grid-area: desc;
    justify-self: center;
    padding: 0 30px;
  }
  & > :nth-child(5) {
    grid-area: sta1;
    padding: 0 30px;
    font-weight: bold;
    margin-top: 12px;
  }
  & > :nth-child(6) {
    grid-area: val1;
    padding: 0 30px;
    margin-top: -12px;
  }
  & > :nth-child(7) {
    grid-area: sta2;
    font-weight: bold;
    margin-top: 12px;
    padding: 0 10px;
  }
  & > :nth-child(8) {
    grid-area: val2;
    padding: 0 10px;
    margin-top: -12px;
  }
  & > :nth-child(9) {
    grid-area: addr;
    padding: 0 30px;
    text-decoration: underline;
  }
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

export default AllocationCard
