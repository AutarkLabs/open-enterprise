import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Button } from '@aragon/ui'

const NewAccountButton = ({ onClick }) => (
  <StyledButton mode="strong" onClick={onClick}>
    New Account
  </StyledButton>
)

NewAccountButton.propTypes = {
  onClick: PropTypes.func
}

const StyledButton = styled(Button)`
  position: absolute;
  top: 10px;
  right: 30px;
  z-index: 2;
`

export default NewAccountButton
