import PropTypes from 'prop-types'
import React from 'react'
import { DropDown } from '@aragon/ui'

const AddressDropDown = ({
  activeItem,
  entities,
  name,
  onChange,
  validator,
  values,
}) => {
  const onChangeInput = index => {
    if (!index) return

    const selected = entities[index].addr

    const newValue = {
      addr: selected,
      index: index,
    }

    const validated = validator(values, selected)

    onChange({
      target: validated
        ? { name: name, value: newValue }
        : { name: 'addressError', value: true }, // enable error msg if needed
    })
  }

  const items = entities.map((e, index) => (
    <span key={index} css="white-space: normal">{e.data.name}</span>
  ))

  return (
    <DropDown items={items} selected={activeItem} onChange={onChangeInput} wide />
  )
}

AddressDropDown.propTypes = {
  activeItem: PropTypes.number.isRequired,
  entities: PropTypes.arrayOf(PropTypes.object),
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  validator: PropTypes.func.isRequired,
  values: PropTypes.array.isRequired,
}

export default AddressDropDown
