import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { IconRemove, theme, unselectable } from '@aragon/ui'

import AddressDropDown from './AddressDropDown'

const AddressDropDownOptions = ({
  activeItem,
  entities,
  input,
  name,
  onChange,
  validator,
  values,
}) => {
  const addOption = ({ target: { value } }) => {
    onChange({
      target: validator(values, value.addr)
        ? { name, value: [ ...values, value ] }
        : { name: 'addressError', value: true }, // enable error msg if needed
    })
  }
  const removeOption = option => {
    // perform the change on the parent by using onChange prop without modifying value prop
    onChange({ target: { name, value: values.filter(v => v !== option) } })
  }

  const loadOptions = values.map((v, i) => (
    <StyledOption key={i}>
      <StyledLockedInput children={entities[v.index].data.name} />
      <IconContainer
        onClick={() => removeOption(v)}
        title="Click to remove"
        children={<IconRemove height={10} width={10} />}
      />
    </StyledOption>
  ))

  return (
    <div style={flexColumn}>
      {loadOptions}
      <StyledOption>
        <AddressDropDown
          activeItem={activeItem}
          entities={entities}
          name="addressBookInput"
          onChange={addOption}
          validator={validator}
          values={values}
          title={'Click to select an Address Book entry'}
        />
      </StyledOption>
    </div>
  )
}

AddressDropDownOptions.propTypes = {
  activeItem: PropTypes.number.isRequired,
  entities: PropTypes.array.isRequired,
  input: PropTypes.object.isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  validator: PropTypes.func.isRequired,
  values: PropTypes.array.isRequired,
}

const flexColumn = { display: 'flex', flexDirection: 'column' }

const StyledLockedInput = styled.div`
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.03);
  padding: 8px 15px;
  padding-right: 40px;
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 3px;
  ${unselectable()};
`

const StyledOption = styled.div`
  display: flex;
  margin-bottom: 0.625rem;
  > :first-child {
    flex-grow: 1;
  }
`

const IconContainer = styled.button`
  ${unselectable};
  all: unset;
  color: ${({ disabled }) => (disabled ? theme.disabled : theme.textSecondary)};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  justify-content: center;
  :hover {
    color: ${({ disabled }) =>
    disabled ? theme.disabled : theme.contentBorderActive};
  }
  :active {
    color: ${({ disabled }) => (disabled ? theme.disabled : theme.accent)};
  }
  > svg {
    color: inherit;
    height: 40px;
    width: 40px;
    transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  }
`

export default AddressDropDownOptions
