import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Button, Viewport, theme } from '@aragon/ui'

const StyledPlus = styled.button`
  border: none;
  background: none;
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: absolute;
  top: 18px;
  right: 30px;
  z-index: 2;

  &:focus {
    border: 2px solid ${theme.accent};
  }

  &:active {
    border: none;
  }
`

const AppTitleButton = props => (
  <Viewport>
    {({ below, width }) => below('small') ? (
      <StyledPlus {...props}>
        <svg width="24px" height="24px" viewBox="0 0 24 24" {...props}>
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          <path d="M0 0h24v24H0z" fill="none" />
        </svg>
      </StyledPlus>
    ) : (
      <StyledButton mode="strong" {...props}>
        {props.caption}
      </StyledButton>
    )}
  </Viewport>
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

