import React from 'react'
import styled from 'styled-components'
import icon from '../../assets/account-card.svg'
import PropTypes from 'prop-types'
import { BigNumber } from 'bignumber.js'
import {
  Card,
  Text,
  ContextMenu,
  ContextMenuItem,
  IconAdd,
  IconSettings,
  SafeLink,
  theme,
} from '@aragon/ui'

const Account = ({
  id,
  proxy,
  balance,
  description,
  limit,
  onNewAllocation,
  onManageParameters,
  onExecutePayout,
  token,
  app,
}) => {
  const newAllocation = () => {
    onNewAllocation(proxy, description, id, limit)
  }

  const manageParameters = () => {
    onManageParameters(proxy)
  }

  const executePayout = () => {
    console.info('App.js: Executing Payout:')
    app.runPayout(id)
  }
  /*Need a better solution that this, should be handled in
  App.js using token manager once more tokens are supported */
  function translateToken(token) {
    if (token == 0x0) {
      return 'ETH'
    }
  }

  const truncatedProxy = `${proxy.slice(0, 6)}...${proxy.slice(-4)}`
  const translatedToken = translateToken(token)

  //TODO: use {etherScanBaseUrl instead of hard coded rinkeby}
  return (
    <StyledCard>
      <MenuContainer>
        <ContextMenu>
          <ContextMenuItem onClick={newAllocation}>
            <IconAdd />
            <ActionLabel>New Allocation</ActionLabel>
          </ContextMenuItem>
          <ContextMenuItem onClick={manageParameters}>
            <IconSettings />
            <ActionLabel>Manage Parameters</ActionLabel>
          </ContextMenuItem>
          <ContextMenuItem onClick={executePayout}>
            <IconSettings />
            <ActionLabel>Execute Payout</ActionLabel>
          </ContextMenuItem>
        </ContextMenu>
      </MenuContainer>
      <IconContainer />
      <CardTitle>{description}</CardTitle>
      <CardAddress>
        <SafeLink
          href={`https://rinkeby.etherscan.io/address/${proxy}`}
          target="_blank"
          title={proxy}
        >
          {truncatedProxy}
        </SafeLink>
      </CardAddress>
      <StatsContainer>
        <Text smallcaps color={theme.textSecondary}>
          Balance
        </Text>
        <StatsValue>
          {' ' + BigNumber(balance)
            .div(BigNumber(10e17))
            .dp(3)
            .toString()}
          {translatedToken}
        </StatsValue>
      </StatsContainer>
      <StatsContainer>
        <Text smallcaps color={theme.textSecondary}>
          Limit
        </Text>
        <StatsValue>
          {limit} {translatedToken}/ Allocation
        </StatsValue>
      </StatsContainer>
    </StyledCard>
  )
}

Account.propTypes = {
  proxy: PropTypes.string.isRequired,
  app: PropTypes.object.isRequired,
  limit: PropTypes.string.isRequired, // We are receiving this as string, parseInt if needed
  token: PropTypes.string.isRequired,
  balance: PropTypes.string.isRequired, // We are receiving this as string, parseInt if needed
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
  align-items: center;
`

const ActionLabel = styled.span`
  margin-left: 15px;
`

const CardTitle = styled(Text.Block).attrs({
  size: 'xxlarge',
})`
  text-align: center;
  font-weight: bold;
  color: ${theme.textPrimary};
`

const CardAddress = styled(Text.Block).attrs({
  size: 'small',
})`
  text-align: center;
  width: 300px;
  color: ${theme.accent};
`

const IconContainer = styled.img.attrs({
  size: 'large',
  src: icon,
})`
  alt: ${({ description }) => description} 'icon';
  margin-top: 4rem;
  margin-left: 120px;
`

const StatsContainer = styled.div`
  width: 50%;
  display: inline-block;
  margin-top: 3rem;
  padding-left: 1rem;
`

const StatsValue = styled.p`
  font-size: 14px;
`

export default Account
