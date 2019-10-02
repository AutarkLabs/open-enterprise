import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Button, IconRemove, TextInput, theme, unselectable } from '@aragon/ui'

import LocalIdentitiesAutoComplete from './LocalIdentitiesAutoComplete'

const RecipientsInput = ({
  name,
  current,
  all,
  onChange,
  placeholder = '',
  valid,
  empty,
}) => {
  const changeRecipient = value => {
    onChange({
      target: { name: 'recipientsChange', value: value },
    })
  }

  const addRecipient = () => {
    onChange({
      target: {
        name: 'recipientsAdd',
        value: [ ...all, current ],
      }
    })
  }

  const removeRecipient = recipient => {
    if (recipient) {
      onChange({
        target: {
          name: 'recipientsRemove',
          value: all.filter(v => v !== recipient)
        }
      })
    }
    else {
      onChange({
        target: {
          name: 'recipientsRemoveCurrent',
          value: true
        }
      })
    }
  }

  const allRecipients = all.map((recipient, i) => (
    <StyledRecipient key={i}>
      <StyledInput
        readOnly
        value={recipient}
        onChange={() => {}}
        wide
      />
      <IconContainer
        style={{ transform: 'scale(.8)' }}
        onClick={() => removeRecipient(recipient)}
        title="Remove this recipient"
        children={<IconRemove />}
      />
    </StyledRecipient>
  ))

  return (
    <div>
      <div style={flexColumn}>
        {allRecipients}
        <StyledRecipient>
          <StyledInput
            placeholder={placeholder}
            value={current}
            onChange={changeRecipient}
            valid={valid}
            wide
          />
          { valid && !empty && (
            <IconContainer
              style={{ transform: 'scale(.8)' }}
              onClick={() => removeRecipient()}
              title="Remove this recipient"
              children={<IconRemove />}
            />
          )}
        </StyledRecipient>
      </div>
      <StyledButton
        disabled={!valid}
        compact
        mode="secondary"
        onClick={addRecipient}
        children={'+ Add Another'}
        title={valid ? 'Click to add' : ''}
      />
    </div>
  )
}

const StyledButton = styled(Button)`
  font-size: 15px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`

RecipientsInput.propTypes = {
  name: PropTypes.string.isRequired,
  current: PropTypes.string.isRequired,
  all: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  valid: PropTypes.bool.isRequired,
}

const flexColumn = { display: 'flex', flexDirection: 'column' }

const StyledRecipient = styled.div`
  display: flex;
  margin-bottom: 0.625rem;
  > :first-child {
    flex-grow: 1;
  }
`

const StyledInput = styled(LocalIdentitiesAutoComplete)`
  ${unselectable};
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
      border-color: ${theme.positive};
    }
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

export default RecipientsInput
