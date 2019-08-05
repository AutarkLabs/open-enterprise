import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { BigNumber } from 'bignumber.js'

import { useNetwork } from '@aragon/api-react'
import {
  Card,
  ContextMenu,
  ContextMenuItem,
  IconAdd,
  Text,
  theme,
} from '@aragon/ui'
import { ETH_DECIMALS } from '../../utils/constants'

import { LocalIdentityBadge } from '../../../../../shared/identity'
import {
  BASE_CARD_WIDTH,
  CARD_STRETCH_BREAKPOINT,
} from '../../utils/responsive'
import icon from '../../assets/account-card.svg'

const Account = ({
  balance,
  description,
  id,
  onNewAllocation,
  proxy,
  screenSize,
}) => {
  const { type } = useNetwork()
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
            networkType={type}
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
            {' ' +
              BigNumber(balance)
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
  balance: PropTypes.string.isRequired, // We are receiving this as string, parseInt if needed
  description: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  proxy: PropTypes.string.isRequired,
  screenSize: PropTypes.number.isRequired,
}

const TitleContainer = styled.div`
  flex-grow: 1;
`

const StyledCard = styled(Card)`
  display: flex;
  margin-bottom: 2rem;
  margin-right: ${props =>
    props.screenSize < CARD_STRETCH_BREAKPOINT ? '0.6rem' : '2rem'};
  flex-direction: column;
  justify-content: flex-start;
  padding: 12px;
  height: 240px;
  width: ${props =>
    props.screenSize < CARD_STRETCH_BREAKPOINT
      ? '100%'
      : BASE_CARD_WIDTH + 'px'};
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
  /* stylelint-disable-next-line */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  /* stylelint-disable-next-line */
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

export default Account
