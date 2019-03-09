import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Button } from '@aragon/ui'

const NewRewardButton = ({ onClick, disabled }) => (
  <StyledButton mode="strong" onClick={onClick} disabled={disabled}>
    New Reward
  </StyledButton>
)

NewRewardButton.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
}

NewRewardButton.defaultProps = {
  disabled: false,
}

const StyledButton = styled(Button)`
  position: absolute;
  top: 10px;
  right: 30px;
  z-index: 2;
`

export default NewRewardButton

