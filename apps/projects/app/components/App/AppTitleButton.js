import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Button } from '@aragon/ui'

const AppTitleButton = ({ caption, onClick, disabled }) => (
  <StyledButton mode="strong" onClick={onClick} disabled={disabled}>
    {caption}
  </StyledButton>
)

AppTitleButton.propTypes = {
  caption: PropTypes.string,
  onClick: PropTypes.func
}

const StyledButton = styled(Button)`
  position: absolute;
  top: 10px;
  right: 30px;
  z-index: 2;
`

export default AppTitleButton

