import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { IconAdd, theme } from '@aragon/ui'

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
    if (input && !validator(value, input.addr)) {
      onChange({ target: { name, value: [...value, input] } })
      resetDropDown()
      console.info('Option Added')
    } else {
      onChange({ target: { name: 'addressError', value: true } })
      console.info('The option is empty or already present')
    }
  }

  const removeOption = option => {
    value.splice(value.indexOf(option), 1).length &&
      onChange({
        target: { name, value },
      })
    console.info('Option Removed', option, value)
  }

  const resetDropDown = () => {
    onChange({
      target: {
        name: 'optionsInput',
        value: {
          addr: 0,
          index: 0,
        },
      },
    })
  }

  const loadOptions = value.map((option, index) => (
    <div className="option" key={option.addr}>
      <MultiDropDown
        name={name}
        index={index}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        entities={entities}
        activeItem={value[index].index}
        validator={validator}
      />
      <IconRemove onClick={() => removeOption(option)} />
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
        <IconAdd onClick={addOption} />
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
