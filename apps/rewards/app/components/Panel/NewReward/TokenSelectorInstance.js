import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Badge, Viewport } from '@aragon/ui'
import { ETHER_TOKEN_FAKE_ADDRESS, } from '../../../utils/token-utils'
import { addressesEqual, shortenAddress } from '../../../utils/web3-utils'

class TokenSelectorInstance extends React.PureComponent {
  static propTypes = {
    address: PropTypes.string,
    name: PropTypes.string,
    shorten: PropTypes.bool.isRequired,
    symbol: PropTypes.string,
    showIcon: PropTypes.bool,
  }

  render() {
    const { address, name, shorten, symbol, showIcon = true } = this.props
    return (
      <Main>
        {showIcon ? (
          <Icon src={`https://chasing-coins.com/coin/logo/${symbol}`} />
        ) : (
          <IconSpacer />
        )}
        {symbol && <TokenSymbol>{symbol}</TokenSymbol>}
        {name && <TokenName>({name})</TokenName>}
      </Main>
    )
  }
}

const Main = styled.div`
  display: flex;
  align-items: center;
`

const Icon = styled.img.attrs({ alt: '', width: '16', height: '16' })`
  margin-right: 10px;
`

const IconSpacer = styled.div`
  width: 26px;
`

const TokenName = styled.span`
  max-width: 110px;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
`

const TokenSymbol = styled.span`
  margin-right: 10px;
`

const StyledAddressBadge = styled(Badge.Identity)`
  flex-shrink: 0;
  margin-left: auto;
`

// eslint-disable-next-line react/display-name
export default props => (
  <Viewport>
    {({ below }) => (
      <TokenSelectorInstance {...props} shorten={below('medium')} />
    )}
  </Viewport>
)
