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
  inactive,
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
      inactive={inactive}
      menu={
        <React.Fragment>
          <ContextMenuItem onClick={newAllocation}>
            <IconPlus />
            <ActionLabel>New allocation</ActionLabel>
          </ContextMenuItem>
          <ContextMenuItem onClick={edit}>
            <IconEdit />
            <ActionLabel>{amount === '0' ? 'Reactivate' : 'Edit'}</ActionLabel>
          </ContextMenuItem>
          {amount > 0 && (
            <ContextMenuItem onClick={deactivate}>
              <IconProhibited />
              <ActionLabel>Deactivate</ActionLabel>
            </ContextMenuItem>
          )}
        </React.Fragment>
      }
    >
      {amount > 0 && (
        <React.Fragment>
          <StatsValueBig css={{ paddingTop: '24px' }} theme={theme}>
            <ProgressBar
              color={String(theme.accentEnd)}
              value={tokensSpent.div(amount).toNumber()}
            />
          </StatsValueBig>
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
  inactive: PropTypes.bool.isRequired,
  onNewAllocation: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
}

const Wrapper = ({ children, name, amount, symbol, inactive, theme, menu }) => (
  <StyledCard theme={theme}>
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
    <CardBottom theme={theme}>
      <Text>{displayCurrency(BigNumber(amount)) + ' ' + symbol + ' / PERIOD'}</Text>
      {(amount === '0' || inactive) ? (
        <Status
          color={theme.negative}
          icon={<IconCross />}
        >
          INACTIVE
        </Status>
      ) : (
        <Status
          color={theme.positive}
          icon={<IconCheck />}
        >
          ACTIVE
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
  inactive: PropTypes.bool.isRequired,
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
  padding: 12px;
  height: 264px;
  width: auto;
`

const CardBottom = styled.div`
  padding: 4px 12px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  position: absolute;
  bottom: 0;
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
  font-weight: normal;
`

/* eslint-disable-next-line import/no-unused-modules */
export default Budget
