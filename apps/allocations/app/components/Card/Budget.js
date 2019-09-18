import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { BigNumber } from 'bignumber.js'

import {
  Card,
  ContextMenu,
  ContextMenuItem,
  IconAdd,
  ProgressBar,
  Text,
  useTheme,
} from '@aragon/ui'
import { displayCurrency } from '../../utils/helpers'

import { BASE_CARD_WIDTH, CARD_STRETCH_BREAKPOINT } from '../../utils/responsive'

const Budget = ({
  id,
  name,
  amount,
  currency,
  allocated,
  onNewAllocation,
  screenSize,
}) => {
  const theme = useTheme()
  const newAllocation = () => {
    onNewAllocation(id, name, amount)
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
      <CardTitle color={theme.content}>{name}</CardTitle>
      <StatsContainer>
        <StyledStats>
          <StatsValueBig color={theme.contentSecondary}>
            {displayCurrency(BigNumber(amount))}
            <Text>{' ' + currency + ' per period'}</Text>
          </StatsValueBig>
          <StatsValueBig css={{ paddingTop: '24px' }}>
            <ProgressBar
              color={theme.accentEnd}
              value={BigNumber(allocated).div(amount).toNumber()}
            />
          </StatsValueBig>
          <StatsValueSmall css={{
            color: theme.content,
            paddingTop: '8px',
          }}>
            {displayCurrency(BigNumber(amount).minus(allocated))}
            <Text>{' ' + currency + ' below limit'}</Text>
          </StatsValueSmall>
          <StatsValueSmall css={{
            color: theme.contentSecondary,
            paddingTop: '4px',
          }}>
            {BigNumber(amount)
              .minus(allocated)
              .div(amount)
              .multipliedBy(100)
              .dp(0)
              .toString()}
            <Text>{'% remaining'}</Text>
          </StatsValueSmall>
        </StyledStats>
      </StatsContainer>
    </StyledCard>
  )
}

Budget.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  amount: PropTypes.string.isRequired,
  currency: PropTypes.string.isRequired,
  allocated: PropTypes.string.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  screenSize: PropTypes.number.isRequired
}

const StyledCard = styled(Card)`
  display: flex;
  margin-bottom: 2rem;
  margin-right: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? '0.6rem' : '2rem'};
  box-shadow: 0px 2px 4px rgba(221, 228, 233, 0.5);
  border: 0px;
  flex-direction: column;
  justify-content: flex-start;
  padding: 12px;
  height: 264px;
  width: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? '100%' : BASE_CARD_WIDTH + 'px'};
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
  font-size: 26px;
  font-weight: 400;
  margin-top: 10px;
  margin-bottom: 5px;
  text-align: center;
  color: ${props => props.color};
  display: block;
  /* stylelint-disable-next-line */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  /* stylelint-disable-next-line */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`

const StatsContainer = styled.div`
  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-content: stretch;
`

const StyledStats = styled.div`
  display: inline-block;
  text-align: center;
  flex-grow: 1;
`

const StatsValueBig = styled.div`
  font-size: 16px;
  color: ${props => props.color};
`

const StatsValueSmall = styled.div`
  font-size: 14px;
  font-weight: 300;
`

export default Budget
