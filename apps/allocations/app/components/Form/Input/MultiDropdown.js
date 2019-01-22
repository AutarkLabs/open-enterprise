import PropTypes from 'prop-types'
import React from 'react'
import { DropDown } from '@aragon/ui'

class MultiDropdown extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    entities: PropTypes.object,
    value: PropTypes.array.isRequired,
    index: PropTypes.number.isRequired,
    activeItem: PropTypes.number.isRequired,
    validator: PropTypes.func.isRequired,
  }
  
  state = {
      activeItem: this.props.activeItem,
  }

  onChangeInput = (index, items) => {
    const { name, value, entities } = this.props
    let newValue = {
        addr: entities[index].addr,
        index: index
    }
    this.props.validator(value, newValue.addr)
    this.setState({ activeItem: index})
    if(name === 'optionsInput'){
        this.props.onChange({ target: { name: 'optionsInput', value: newValue } })
    } else {
        value[this.props.index] = newValue
        this.props.onChange({ target: { name, value: value } })
    }
  }

  render() {
    return (
        <DropDown
            items={this.props.entities.map(entity => entity.data.name)}
            active={this.state.activeItem ? this.state.activeItem : 0 }
            onChange={this.onChangeInput}
            wide={true}
        />
    )
  }
}


export default MultiDropdown
