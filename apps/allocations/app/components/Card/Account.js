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
  breakpoint,
  theme,
} from '@aragon/ui'
import { ETH_DECIMALS } from '../../utils/constants'
import { provideNetwork } from '../../../../../shared/ui'
import { BASE_CARD_WIDTH, CARD_STRETCH_BREAKPOINT } from '../../utils/responsive'
import LocalIdentityBadge from '../Shared/LocalIdentityBadge'

const Account = ({
  id,
  proxy,
  balance,
  description,
  network,
  onNewAllocation,
  screenSize,
}) => {
  const newAllocation = () => {
    onNewAllocation(proxy, description, id, balance)
  }

  return (
    <StyledCard screenSize={screenSize}>
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
          <LocalIdentityBadge
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

const StyledCard = styled(Card)`
  display: flex;
  ${breakpoint(
    'small',
    `
    margin-bottom: 2rem;
    `
  )};
  margin-bottom: 0.3rem;
  margin-right: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? '0.6rem' : '2rem' };
  flex-direction: column;
  justify-content: flex-start;
  padding: 12px;
  height: 240px;
  width: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? '100%' : BASE_CARD_WIDTH + 'px' };
  transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  :hover {
    cursor: pointer;
    box-shadow: 0 9px 10px 0 rgba(101, 148, 170, 0.1);
  }
`

const MenuContainer = styled.div`
  align-self: flex-end;
  align-items: center;
`

const ActionLabel = styled.span`
  margin-left: 15px;
`

const CardTitle = styled(Text.Block).attrs({
  size: 'large',
  weight: 'bold',
})`
  margin-top: 10px;
  margin-bottom: 5px;
  text-align: center;
  color: ${theme.textPrimary};
  display: block;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
