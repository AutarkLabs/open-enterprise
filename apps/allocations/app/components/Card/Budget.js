import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { displayCurrency } from '../../utils/helpers'

import {
  Card,
  ContextMenu,
  ContextMenuItem,
  IconEdit,
  IconPlus,
  IconProhibited,
  IconView,
  ProgressBar,
  Text,
  useTheme,
} from '@aragon/ui'

import {
  BASE_CARD_WIDTH,
  CARD_STRETCH_BREAKPOINT,
} from '../../utils/responsive'

const Budget = ({
  id,
  name,
  amount,
  token,
  remaining = 0,
  inactive,
  onNewAllocation,
  onEdit,
  onDeactivate,
  onReactivate,
  screenSize
}) => {
  const theme = useTheme()

  const newAllocation = () => {
    onNewAllocation(id)
  }
  const edit = () => {
    onEdit(id)
  }
  const deactivate = () => {
    onDeactivate(id)
  }

  const reactivate = () => {
    onReactivate(id)
  }
  const tokenAmount = rawAmount => BigNumber(rawAmount).div(BigNumber(10).pow(token.decimals))
  const tokensSpent = tokenAmount(amount).minus(BigNumber(remaining).div(BigNumber(10).pow(token.decimals)))
  if (inactive) {
    return (
      <Wrapper
        name={name}
        screenSize={screenSize}
        theme={theme}
        menu={
          <ContextMenuItem onClick={reactivate}>
            <IconView />
            <ActionLabel>Reactivate</ActionLabel>
          </ContextMenuItem>
        }
      >
        <StatsValueBig theme={theme}>
          <Text>Inactive</Text>
        </StatsValueBig>
      </Wrapper>
    )
  }

  return (
    <Wrapper
      name={name}
      screenSize={screenSize}
      theme={theme}
      menu={
        <React.Fragment>
          <ContextMenuItem onClick={newAllocation}>
            <IconPlus />
            <ActionLabel>New Allocation</ActionLabel>
          </ContextMenuItem>
          <ContextMenuItem onClick={edit}>
            <IconEdit />
            <ActionLabel>Edit</ActionLabel>
          </ContextMenuItem>
          <ContextMenuItem onClick={deactivate}>
            <IconProhibited />
            <ActionLabel>Deactivate</ActionLabel>
          </ContextMenuItem>
        </React.Fragment>
      }
    >
      <StatsValueBig theme={theme}>
        {displayCurrency(BigNumber(amount))}
        <Text>{' ' + token.symbol + ' per period'}</Text>
      </StatsValueBig>
      <StatsValueBig css={{ paddingTop: '24px' }} theme={theme}>
        <ProgressBar
          color={String(theme.accentEnd)}
          value={tokensSpent.div(tokenAmount(amount)).toNumber()}
        />
      </StatsValueBig>
      <StatsValueSmall css={{
        color: theme.content,
        paddingTop: '8px',
      }}>
        {displayCurrency(BigNumber(remaining))}
        <Text>{' ' + token.symbol + ' below limit'}</Text>
      </StatsValueSmall>
      <StatsValueSmall css={{
        color: theme.contentSecondary,
        paddingTop: '4px',
      }}>
        {BigNumber(remaining)
          .div(amount)
          .multipliedBy(100)
          .dp(0)
          .toString()}
        <Text>{'% remaining'}</Text>
      </StatsValueSmall>
    </Wrapper>
  )
}

Budget.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  amount: PropTypes.string.isRequired,
  token: PropTypes.object.isRequired,
  // TODO: fix remaining (should be required?)
  remaining: PropTypes.string,
  inactive: PropTypes.bool.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
  onReactivate: PropTypes.func.isRequired,
  screenSize: PropTypes.number.isRequired,
}

const Wrapper = ({ children, name, screenSize, theme, menu }) => (
  <StyledCard screenSize={screenSize} theme={theme}>
    <MenuContainer>
      <ContextMenu>
        {menu}
      </ContextMenu>
    </MenuContainer>
    <CardTitle theme={theme}>{name}</CardTitle>
    <StatsContainer>
      <StyledStats>
        {children}
      </StyledStats>
    </StatsContainer>
  </StyledCard>
)

Wrapper.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  screenSize: PropTypes.number.isRequired,
  theme: PropTypes.object.isRequired,
  menu: PropTypes.node.isRequired,
}

const StyledCard = styled(Card)`
  display: flex;
  margin-bottom: 2rem;
  margin-right: ${props => props.screenSize < CARD_STRETCH_BREAKPOINT ? '0.6rem' : '2rem'};
  box-shadow: ${({ theme }) => '0 2px 4px ' + theme.border};
  border: 0;
  flex-direction: column;
  justify-content: flex-start;
  padding: 12px;
  height: 264px;
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
  font-size: 26px;
  font-weight: 400;
  margin-top: 10px;
  margin-bottom: 5px;
  text-align: center;
  color: ${({ theme }) => theme.content};
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
  color: ${({ theme }) => theme.contentSecondary};
`

const StatsValueSmall = styled.div`
  font-size: 14px;
  font-weight: 300;
`

/* eslint-disable-next-line import/no-unused-modules */
export default Budget
