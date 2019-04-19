import React from 'react'
import PropTypes from 'prop-types'
import { Text, TextInput } from '@aragon/ui'

const ReadOrEditTextField = ({
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
      <TextInput
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

ReadOrEditTextField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  editing: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
}

ReadOrEditTextField.defaultProps = {
  editing: false,
  disabled: false,
  type: 'text',
  wide: false,
}

export default ReadOrEditTextField
