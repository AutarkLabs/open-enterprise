import React from 'react'
import styled from 'styled-components'
import { Text, theme } from '@aragon/ui'

const StyledTitle = styled(Text)`
  position: relative;
  z-index: 1;
  display: block;
  padding-left: 30px;
  line-height: 63px;
  background: ${theme.contentBackground};
  box-shadow: rgba(0, 0, 0, 0.1) 1px 0 15px;
  overflow: visible;
  border-bottom: 1px solid ${theme.contentBorder};
`

export const AppTitle = () => <StyledTitle size="xxlarge">Projects</StyledTitle>
