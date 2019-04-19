import React from 'react'
import PropTypes from 'prop-types'
import { SafeLink, TextInput, Text, theme } from '@aragon/ui'

const style = { color: theme.accent }

const ReadOrEditSafeLink = ({
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
        <SafeLink style={style} href={value} target="_blank" size={size}>
          {value}
        </SafeLink>
      ) : (
        <Text size={size} color="grey">
          {placeholder}
        </Text>
      )}
    </div>
  )
}

ReadOrEditSafeLink.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
  editing: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.string,
}

ReadOrEditSafeLink.defaultProps = {
  editing: false,
  disabled: false,
  type: 'text',
  wide: false,
}

export default ReadOrEditSafeLink
