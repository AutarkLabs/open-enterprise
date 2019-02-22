import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Badge, Text, theme } from '@aragon/ui'

import { CheckBox } from '../../Shared'

const SettingsInput = ({
  name,
  onChange,
  text,
  value = false,
  visible = true,
}) => {
  const changeChecked = () => {
    onChange({ target: { name, value: !value } })
  }
  return visible ? (
    <StyledSettingsInput>
      <CheckBox checked={value} onChange={changeChecked} />
      <Text>{text}</Text>
      <Badge.Info small>?</Badge.Info>
    </StyledSettingsInput>
  ) : null
}

SettingsInput.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  value: PropTypes.bool,
  visible: PropTypes.bool,
}

const StyledSettingsInput = styled.div`
  display: flex;
  padding-top: 10px;
  align-items: center;
  color: ${theme.textTertiary};
  > * {
    margin-right: 0.5rem;
  }
  > :last-child:last-child {
    padding: 0;
  }
`

export default SettingsInput
