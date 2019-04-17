import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Text, theme, unselectable, Viewport } from '@aragon/ui'
import { MenuButton } from '../../../../../shared/ui'

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

const Title = ({ text, shadow, displayMenuButton, handleMenuPanelOpen }) => (
  <div style={{ display: 'flex', alignItems: 'center', background: 'white' }}>
    {displayMenuButton && <MenuButton onClick={handleMenuPanelOpen} />}
    <StyledTitle size="xxlarge" shadow={shadow}>
      {text}
    </StyledTitle>
  </div>
)

Title.propTypes = {
  text: PropTypes.string.isRequired,
  handleMenuPanelOpen: PropTypes.func.isRequired,
  displayMenuButton: PropTypes.bool,
  shadow: PropTypes.bool,
}

export default Title
