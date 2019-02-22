import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { IconAdd, IconRemove, TextInput, theme, unselectable } from '@aragon/ui'

const OptionsInput = ({
  input,
  name,
  onChange,
  placeholder = '',
  validator,
  values,
}) => {
  const addOption = () => {
    const noError = input && !validator(values, input.addr)
    onChange({
      target: noError
        ? { name, value: [...values, input] }
        : { name: 'addressError', value: true }, // enable error msg if needed
    })
    resetDropDown()
  }

  const removeOption = option => {
    // perform the change on the parent by using onChange prop without modifying value prop
    onChange({ target: { name, value: values.filter(v => v !== option) } })
  }

  const resetDropDown = () => {
    onChange({ target: { name: 'optionsInputString', value: { addr: '' } } })
  }

  const onChangeInput = ({ target: { value } }) => {
    onChange({
      target: { name: 'optionsInputString', value: { addr: value } },
    })
  }

  const loadOptions = values.map((option, i) => (
      <StyledInput readOnly value={option.addr} />
      <IconRemove style={pointer} onClick={() => removeOption(option)} />
    </div>
  ))

  return (
    <StyledOptionsInput empty={!input.length}>
      {loadOptions}
      <div className="option">
        <StyledInput
          placeholder={placeholder}
          value={input.addr}
          onChange={onChangeInput}
        />
        <IconAdd style={pointer} onClick={addOption} />
      </div>
    </StyledOptionsInput>
  )
}

OptionsInput.propTypes = {
  input: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  validator: PropTypes.func.isRequired,
  values: PropTypes.array.isRequired,
}

const pointer = { cursor: 'pointer' }

const StyledInput = styled(TextInput)`
  ${unselectable}; /* it is possible to select the placeholder without this */
  ::placeholder {
    color: ${theme.contentBorderActive};
  }
  :focus {
    border-color: ${theme.contentBorderActive};
    ::placeholder {
      color: ${theme.contentBorderActive};
    }
  }
  :read-only {
    cursor: default;
    :focus {
      border-color: ${theme.contentBorder};
    }
  }
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

export default OptionsInput
