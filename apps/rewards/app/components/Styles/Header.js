import styled from 'styled-components'
import { Text } from '@aragon/ui'

const Header = styled(Text.Block).attrs({
  smallcaps: true,
})`
  color: ${({ theme }) => theme.contentSecondary};
  margin-top: 16px;
  margin-bottom: 8px;
`

export default Header
