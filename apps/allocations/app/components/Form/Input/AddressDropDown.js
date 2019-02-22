import PropTypes from 'prop-types'
import React from 'react'
import { DropDown } from '@aragon/ui'

const AddressDropDown = ({ activeItem, entities, name, onChange }) => {
  const onChangeInput = index => {
    if (!index) return
    const newValue = {
      addr: entities[index].addr,
      index: index, // index 0 is 'Select entry'
    }
    onChange({ target: { name: name, value: newValue } })
  }

  const items = entities.map(e => (
    <span style={{ whiteSpace: 'normal' }}>{e.data.name}</span>
  ))

  return (
    <DropDown items={items} active={activeItem} onChange={onChangeInput} wide />
  )
}

AddressDropDown.propTypes = {
  activeItem: PropTypes.number.isRequired,
  entities: PropTypes.arrayOf(PropTypes.object),
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default AddressDropDown
