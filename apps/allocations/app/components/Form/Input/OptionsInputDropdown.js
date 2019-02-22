import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { IconAdd, theme, unselectable } from '@aragon/ui'

import IconRemove from '../../../assets/components/IconRemove'
import MultiDropDown from './MultiDropdown'

const OptionsInputDropdown = ({
  activeItem,
  entities,
  input,
  name,
  onChange,
  placeholder = '',
  validator,
  value,
}) => {
  const addOption = () => {
    const noError = input && !validator(value, input.addr)
    onChange({
      target: noError
        ? { name, value: [...value, input] }
        : { name: 'addressError', value: true }, // enable error msg if needed
    })
    resetDropDown()
  }

  const removeOption = option => {
    // perform the change on the parent by using onChange prop without modifying value prop
    onChange({ target: { name, value: value.filter(v => v !== option) } })
  }

  const resetDropDown = () => {
    onChange({ target: { name: 'optionsInput', value: { addr: 0, index: 0 } } })
  }

  const loadOptions = value.map((option, i) => (
    <div className="option" key={i}>
      <StyledLockedInput children={entities[i + 1].data.name} />
      <IconRemove style={pointer} onClick={() => removeOption(option)} />
    </div>
  ))

  return (
    <StyledOptionsInput empty={!input.length}>
      {loadOptions}
      <div className="option">
        <MultiDropDown
          name={'optionsInput'}
          index={-1}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          entities={entities}
          activeItem={activeItem}
          validator={validator}
        />
        <IconAdd style={pointer} onClick={addOption} />
      </div>
    </StyledOptionsInput>
  )
}
OptionsInputDropdown.propTypes = {
  activeItem: PropTypes.number.isRequired,
  entities: PropTypes.array.isRequired,
  input: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  validator: PropTypes.func.isRequired,
  value: PropTypes.array.isRequired,
}

const pointer = { cursor: 'pointer' }

const StyledLockedInput = styled.div`
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
  padding: 8px 15px;
  padding-right: 40px;
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
  ${unselectable()};
`

const StyledOptionsInput = styled.div`
  display: flex;
  flex-direction: column;
  > .option {
    display: flex;
    margin-bottom: 0.625rem;
    > :first-child {
      flex-grow: 1;
    }
    > svg {
      margin-left: 3px;
      margin-top: -3px;
      height: auto;
      width: 1.8rem;
      color: ${theme.textSecondary};
      vertical-align: middle;
      transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
      :hover {
        color: ${({ empty }) =>
    empty ? theme.disabled : theme.contentBorderActive};
      }
      :active {
        color: ${({ empty }) =>
    empty ? theme.disabled : theme.contentBackgroundActive};
      }
    }
  }
`

export default OptionsInputDropdown
