import React from 'react'
import PropTypes from 'prop-types'
import { Text, TextInput } from '@aragon/ui'

const ReadOrEditTextField = ({
  type,
  editing,
  disabled,
  onChange,
  wide,
  value,
  placeholder,
}) => {
  if (editing) {
    return (
      <TextInput
        type={type}
        disabled={disabled}
        wide={wide}
        onChange={onChange}
        value={value}
        placeholder={placeholder}
      />
    )
  }

  return <Text>{value}</Text>
}

ReadOrEditTextField.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  editing: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  wide: PropTypes.bool,
}

ReadOrEditTextField.defaultProps = {
  editing: false,
  disabled: false,
  type: 'text',
  wide: false,
}

export default ReadOrEditTextField
