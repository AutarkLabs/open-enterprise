import React from 'react'
import styled from 'styled-components'
import { IconAdd, theme, unselectable } from '@aragon/ui'

// TODO: Delete this component;

const BarButtonItem = props => (
  <StyledBarButtonItem>
    <IconAdd />
    {props.text}
  </StyledBarButtonItem>
)

const StyledBarButtonItem = styled.div`
  display: flex;
  padding: 5px 20px;
  cursor: pointer;
  color: ${theme.textPrimary};
  font-weight: 600;
  ${unselectable()};
  :active {
    background: ${theme.secondaryBackground};
  }
  > :first-child {
    color: ${theme.textSecondary};
    margin-right: 15px;
  }
  :hover {
    color: ${theme.textSecondary};
  }
`

export default BarButtonItem
