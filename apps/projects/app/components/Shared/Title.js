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

const Title = ({ text, shadow, handleMenuPanelOpen }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    {/* TODO: issue #528*/}
    <Viewport>
      {({ below }) =>
        below('small') && <MenuButton onClick={handleMenuPanelOpen} />
      }
    </Viewport>
    {/**/}
    <StyledTitle size="xxlarge" shadow={shadow}>
      {text}
    </StyledTitle>
  </div>
)

Title.propTypes = {
  text: PropTypes.string.isRequired,
  handleMenuPanelOpen : PropTypes.func.isRequired,
  shadow: PropTypes.bool,
}

export default Title
