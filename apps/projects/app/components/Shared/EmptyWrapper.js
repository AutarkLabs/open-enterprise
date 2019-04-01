import styled from 'styled-components'
import { unselectable } from '@aragon/ui'

const EmptyWrapper = styled.div`
  ${unselectable};
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`

export default EmptyWrapper
