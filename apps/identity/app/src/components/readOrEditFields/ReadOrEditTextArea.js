import React from 'react'
import PropTypes from 'prop-types'
import styled, { css } from 'styled-components'
import { Text, font, theme } from '@aragon/ui'

const ReadOrEditTextArea = ({
  type,
  editing,
  disabled,
  onChange,
  value,
  placeholder,
  size,
}) => {
  if (editing) {
    return (
      <TextArea
        type={type}
        disabled={disabled}
        onChange={onChange}
        value={value}
        placeholder={placeholder}
      />
    )
  }

  return (
    <div>
      {value ? (
        <Text size={size}>{value}</Text>
      ) : (
        <Text size={size} color="grey">
          {placeholder}
        </Text>
      )}
    </div>
  )
}

ReadOrEditTextArea.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  editing: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
}

ReadOrEditTextArea.defaultProps = {
  editing: false,
  disabled: false,
  type: 'text',
  wide: false,
}

const baseStyles = css`
  ${font({ size: 'small', weight: 'normal' })};
  width: ${({ wide }) => (wide ? '100%' : 'auto')};
  height: 40px;
  padding: 0 10px;
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
  color: ${theme.textPrimary};
  appearance: none;
  &:focus {
    outline: none;
    border-color: ${theme.contentBorderActive};
  }
  &:read-only {
    color: transparent;
    text-shadow: 0 0 0 ${theme.textSecondary};
  }
  width: 169px;
  max-width: 300px;
`

const TextArea = styled.textarea`
  ${baseStyles};
`

export default ReadOrEditTextArea
