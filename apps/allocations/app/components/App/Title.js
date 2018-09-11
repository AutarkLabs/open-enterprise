import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, theme, unselectable } from '@aragon/ui'

const StyledTitle = styled(Text)`
  ${unselectable};
  background: ${theme.contentBackground};
  border-bottom: 1px solid ${theme.contentBorder};
  display: block;
  line-height: 63px;
  overflow: visible;
  padding-left: 30px;
  position: relative;
  z-index: 1;
`

const AppTitle = ({ text }) => <StyledTitle size="xxlarge">{text}</StyledTitle>

AppTitle.propTypes = {
  text: PropTypes.string.isRequired,
}

export default AppTitle
