import styled from 'styled-components'
import { theme, unselectable } from '@aragon/ui'

const FieldTitle = styled.label`
  ${unselectable};
  color: ${theme.textSecondary};
  text-transform: lowercase;
  font-variant: small-caps;
  font-weight: bold;
`

export default FieldTitle
