import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, theme, unselectable } from '@aragon/ui'

const StyledTitle = styled(Text)`
  ${unselectable};
  background: ${theme.contentBackground};
  ${({ shadow }) => shadow && 'box-shadow: rgba(0, 0, 0, 0.1) 1px 0 15px'};
  display: block;
  line-height: 63px;
  overflow: visible;
  padding-left: 30px;
  position: relative;
  z-index: 1;
`

const Title = ({ text, shadow }) => (
  <StyledTitle size="xxlarge" shadow={shadow}>
    {text}
  </StyledTitle>
)

Title.propTypes = {
  text: PropTypes.string.isRequired,
  shadow: PropTypes.bool,
}

export default Title
