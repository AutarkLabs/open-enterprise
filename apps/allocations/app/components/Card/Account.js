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
  IdentityBadge,
  SafeLink,
  theme,
} from '@aragon/ui'
import { ETH_DECIMALS } from '../../utils/constants'
import { provideNetwork } from '../../../../../shared/ui'

const Account = ({
  id,
  proxy,
  balance,
  description,
  network,
  onNewAllocation,
  token,
  app,
}) => {
  const newAllocation = () => {
    onNewAllocation(proxy, description, id)
  }

  /*Need a better solution that this, should be handled in
  App.js using token manager once more tokens are supported */
  function translateToken(token) {
    if (token == 0x0) {
      return 'ETH'
    }
  }

  const translatedToken = translateToken(token)

  return (
    <StyledCard>
      <MenuContainer>
        <ContextMenu>
          <ContextMenuItem onClick={newAllocation}>
            <IconAdd />
            <ActionLabel>New Allocation</ActionLabel>
          </ContextMenuItem>
        </ContextMenu>
      </MenuContainer>
      <IconContainer />
      <TitleContainer>
        <CardTitle>{description}</CardTitle>
        <CardAddress>
          <IdentityBadge
            networkType={network.type}
            entity={proxy}
            shorten={true}
          />
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
              .toString()}
            <Text size="small">{' ETH'}</Text>
          </StatsValue>
        </StyledStats>
      </StatsContainer>
    </StyledCard>
  )
}

Account.propTypes = {
  proxy: PropTypes.string.isRequired,
  app: PropTypes.object.isRequired,
  balance: PropTypes.string.isRequired, // We are receiving this as string, parseInt if needed
  description: PropTypes.string.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  network: PropTypes.object,
}

const TitleContainer = styled.div`
  flex-grow: 1;
`

const StyledCard = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 14px;
  background: #ffffff;
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
`

const MenuContainer = styled.div`
  align-self: flex-end;
  align-items: center;
`

const ActionLabel = styled.span`
  margin-left: 15px;
`

const CardTitle = styled(Text.Block).attrs({
  size: 'xlarge',
})`
  text-align: center;
  color: ${theme.textPrimary};
  display: block;
  max-height: 3em;
  line-height: 1.5em;
  overflow: hidden;
  padding-top: 4px;
  text-overflow: ellipsis;
`

const CardAddress = styled(Text.Block).attrs({
  size: 'small',
})`
  display: flex;
  justify-content: center;
  padding-top: 5px;
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
  justify-content: center;
  align-content: stretch;
`

const StyledStats = styled.div`
  display: inline-block;
  text-align: center;
`

const StatsValue = styled.p`
  font-size: 1.1em;
`

export default provideNetwork(Account)
