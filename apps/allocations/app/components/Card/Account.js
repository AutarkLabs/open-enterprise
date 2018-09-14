import React from 'react'
import styled from 'styled-components'
import icon from '../../assets/account-card.svg'
import PropTypes from 'prop-types'

import { Card, Text, theme } from '@aragon/ui'

import { ContextMenuItems } from '.'

const Account = ({
  address,
  balance,
  description,
  limit,
  onNewAllocation,
  onManageParameters,
  token,
}) => {
  const newAllocation = () => {
    onNewAllocation(address, description)
  }

  const manageParameters = () => {
    onManageParameters(address)
  }

  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <StyledCard>
      <MenuContainer>
        <ContextMenuItems actions={{ manageParameters, newAllocation }} />
      </MenuContainer>
      <IconContainer />
      <CardTitle>{description}</CardTitle>
      <CardAddress>{truncatedAddress}</CardAddress>
      <StatsContainer>
        <StatsTitle>Balance</StatsTitle>
        <StatsValue>
          {balance} {token}
        </StatsValue>
      </StatsContainer>
      <StatsContainer>
        <StatsTitle>Limit</StatsTitle>
        <StatsValue>
          {limit} {token}/ Payout
        </StatsValue>
      </StatsContainer>
    </StyledCard>
  )
}

Account.propTypes = {
  address: PropTypes.string.isRequired,
  limit: PropTypes.number.isRequired,
  token: PropTypes.string.isRequired,
  balance: PropTypes.number.isRequired,
  description: PropTypes.string.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  onManageParameters: PropTypes.func.isRequired,
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

const CardTitle = styled(Text.Block).attrs({
  size: 'large',
})`
  text-align: center;
  font-weight: bold;
  font-size: 20px;
  color: ${theme.textPrimary};
`

const CardAddress = styled(Text.Block).attrs({
  size: 'small',
  color: '#4a90e2',
})`
  width: 300px;
  text-align: center;
  text-decoration: underline;
  cursor: pointer;
`

const IconContainer = styled.img.attrs({
  size: 'large',
  src: icon,
})`
  alt: ${({ description }) => description} 'icon';
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

export default Account
