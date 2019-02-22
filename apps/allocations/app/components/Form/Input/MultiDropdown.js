import PropTypes from 'prop-types'
import React from 'react'
import { DropDown } from '@aragon/ui'

const MultiDropdown = ({
  activeItem,
  entities,
  name,
  onChange,
  validator,
  value,
}) => {
  const onChangeInput = index => {
    const newValue = {
      addr: entities[index].addr,
      index: index,
    }
    const validation = validator(value, newValue.addr) ? true : false
    const inputValue = name === 'optionsInput' ? newValue : value

    // First onChange is for validator, second is for the input itself
    onChange({ target: { name: 'addressError', value: validation } })
    onChange({ target: { name: name, value: inputValue } })
  }

  const items = entities.map(entity => (
    <span style={{ whiteSpace: 'normal' }}>{entity.data.name}</span>
  ))

  return (
    <DropDown items={items} active={activeItem} onChange={onChangeInput} wide />
  )
}

MultiDropdown.propTypes = {
  activeItem: PropTypes.number.isRequired,
  entities: PropTypes.array,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  validator: PropTypes.func.isRequired,
  value: PropTypes.array.isRequired,
}

export default MultiDropdown
