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
  IconFundraising,
  SafeLink,
  theme,
} from '@aragon/ui'
import { ETH_DECIMALS } from '../../utils/constants'

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
          <ContextMenuItem onClick={executePayout}>
            <IconFundraising />
            <ActionLabel>Distribute Allocation</ActionLabel>
          </ContextMenuItem>
        </ContextMenu>
      </MenuContainer>
      <IconContainer />
      <TitleContainer>
        <CardTitle>
          {description}
        </CardTitle>
        <CardAddress>
          <SafeLink
            href={`https://rinkeby.etherscan.io/address/${proxy}`}
            target="_blank"
            title={proxy}
          >
            {truncatedProxy}
          </SafeLink>
        </CardAddress>
      </TitleContainer>
      <StatsContainer>
        <StyledStats>
          <Text smallcaps color={theme.textSecondary}>
            Balance
          </Text>
          <StatsValue>
            {' ' + BigNumber(balance)
              .div(ETH_DECIMALS)
              .dp(3)
              .toString()} {translatedToken}
          </StatsValue>
        </StyledStats>
        <StyledStats>
          <Text smallcaps color={theme.textSecondary}>
            Limit
          </Text>
          <StatsValue>
            {' ' + BigNumber(limit)
              .div(ETH_DECIMALS)
              .dp(3)
              .toString()} {translatedToken}/ Allocation
          </StatsValue>
        </StyledStats>
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

const TitleContainer = styled.div`
  flex-grow: 1;
`

const StyledCard = styled(Card)`
  height: 300px;
  width: 300px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 12px;
`

const MenuContainer = styled.div`
  align-self: flex-end;
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
  display: block;
  display: -webkit-box;
  max-height: 3.0em;
  line-height: 1.5em;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CardAddress = styled(Text.Block).attrs({
  size: 'small',
})`
  text-align: center;
  color: ${theme.accent};
`

const IconContainer = styled.img.attrs({
  size: 'large',
  src: icon,
})`
  alt: ${({ description }) => description} 'icon';
  margin-top: 1em;
  align-content: center;
`

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-content: stretch;
`

const StyledStats = styled.div`
  display: inline-block;
`

const StatsValue = styled.p`
  font-size: 14px;
`

export default Account
