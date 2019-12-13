import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import BigNumber from 'bignumber.js'
import { displayCurrency } from '../../utils/helpers'

import {
  Card,
  ContextMenu,
  ContextMenuItem,
  IconCheck,
  IconCross,
  IconEdit,
  IconPlus,
  IconProhibited,
  ProgressBar,
  Text,
  useTheme,
} from '@aragon/ui'

const Budget = ({
  id,
  name,
  amount,
  token,
  remaining = 0,
  active,
  onNewAllocation,
  onEdit,
  onDeactivate,
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

  const tokensSpent = BigNumber(amount).minus(remaining)

  return (
    <Wrapper
      name={name}
      theme={theme}
      amount={amount}
      symbol={token.symbol}
      active={active}
      menu={
        <React.Fragment>
          {active && (
            <ContextMenuItem onClick={newAllocation}>
              <IconPlus />
              <ActionLabel>New allocation</ActionLabel>
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={edit}>
            <IconEdit />
            <ActionLabel>{active ? 'Edit' : 'Reactivate'}</ActionLabel>
          </ContextMenuItem>
          {active && (
            <ContextMenuItem onClick={deactivate}>
              <IconProhibited />
              <ActionLabel>Deactivate</ActionLabel>
            </ContextMenuItem>
          )}
        </React.Fragment>
      }
    >
      {active && (
        <React.Fragment>
          <ProgressBar
            color={String(theme.accentEnd)}
            value={tokensSpent.div(amount).toNumber()}
          />
          <StatsValueSmall css={{
            color: theme.content,
            paddingTop: '8px',
          }}>
            {displayCurrency(tokensSpent)}
            <Text>{' ' + token.symbol + ' utilized'}</Text>
          </StatsValueSmall>
        </React.Fragment>
      )}
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
  active: PropTypes.bool.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
}

const Wrapper = ({ children, name, amount, symbol, active, theme, menu }) => (
  <StyledCard theme={theme}>
    <CardTop>
      <MenuContainer>
        <ContextMenu>
          {menu}
        </ContextMenu>
      </MenuContainer>
      <CardTitle theme={theme}>{name}</CardTitle>
      <StatsContainer>
        {children}
      </StatsContainer>
    </CardTop>
    <CardBottom theme={theme}>
      <Text>{displayCurrency(BigNumber(amount)) + ' ' + symbol + ' / PERIOD'}</Text>
      {active ? (
        <Status
          color={theme.positive}
          icon={<IconCheck />}
        >
          ACTIVE
        </Status>
      ) : (
        <Status
          color={theme.negative}
          icon={<IconCross />}
        >
          INACTIVE
        </Status>
      )}
    </CardBottom>
  </StyledCard>
)

Wrapper.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  amount: PropTypes.string.isRequired,
  symbol: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  theme: PropTypes.object.isRequired,
  menu: PropTypes.node.isRequired,
}

const Status = ({ children, color, icon }) => (
  <div css={`
      display: flex;
      color: ${color}
    `}
  >
    {icon}
    <span>{children}</span>
  </div>
)

Status.propTypes = {
  children: PropTypes.node.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.object.isRequired,
}

const StyledCard = styled(Card)`
  box-shadow: ${({ theme }) => '0 2px 4px ' + theme.border};
  border: 0;
  height: 264px;
  width: auto;
`

const CardTop = styled.div`
  padding: 12px;
  height: 229px;
  width: 100%;
  display: flex;
  flex-direction: column;
`

const CardBottom = styled.div`
  padding: 4px 12px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  line-height: 26px;
  vertical-align: middle;
  color: ${({ theme }) => theme.contentSecondary};
  border-top: 1px solid ${({ theme }) => theme.border};
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
  height: 78px;
  font-size: 24px;
  font-weight: 400;
  margin: 20px 12px;
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
  text-align: center;
  padding: 12px;
`

const StatsValueBig = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.contentSecondary};
`

const StatsValueSmall = styled.div`
  font-size: 14px;
  font-weight: normal;
`

/* eslint-disable-next-line import/no-unused-modules */
export default Budget
