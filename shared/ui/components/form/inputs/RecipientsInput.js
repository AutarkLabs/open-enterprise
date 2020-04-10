import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Button, IconPlus, IconRemove, useTheme, unselectable } from '@aragon/ui'

import LocalIdentitiesAutoComplete from './LocalIdentitiesAutoComplete'

const RecipientsInput = ({
  recipients,
  recipientsValid,
  onChange,
}) => {
  const theme = useTheme()

  const changeRecipient = (value, id) => {
    onChange({
      target: { name: 'recipientsChange', value, id },
    })
  }

  const addRecipient = () => {
    onChange({
      target: {
        name: 'recipientsAdd',
        value: true,
      }
    })
  }

  const removeRecipient = id => {
    onChange({
      target: {
        name: 'recipientsRemove',
        id,
      }
    })
  }

  return (
    <div>
      <div style={flexColumn}>
        { Object.keys(recipients)
          .sort((a, b) => a - b)
          .map((id) => (
            <StyledRecipient key={id}>
              <AutoCompleteWrapper valid={recipientsValid[id]}>
                <LocalIdentitiesAutoComplete
                  value={recipients[id]}
                  onChange={v => changeRecipient(v, id)}
                  wide
                />
              </AutoCompleteWrapper>
              { Object.keys(recipients).length > 1 && (
                <IconContainer
                  theme={theme}
                  style={{ transform: 'scale(.8)' }}
                  onClick={() => removeRecipient(id)}
                  title="Remove this recipient"
                >
                  <IconRemove />
                </IconContainer>
              )}
            </StyledRecipient>
          ))}
      </div>
      <Button
        icon={
          <IconPlus
            css={`
              color: ${theme.accent};
            `}
          />
        }
        label='Add more'
        title='Click to add'
        onClick={addRecipient}
      />
    </div>
  )
}

RecipientsInput.propTypes = {
  recipients: PropTypes.object.isRequired,
  recipientsValid: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

const flexColumn = { display: 'flex', flexDirection: 'column' }

const StyledRecipient = styled.div`
  display: flex;
  margin-bottom: 0.625rem;
  > :first-child {
    flex-grow: 1;
  }
`

const AutoCompleteWrapper = styled.div`
  border-radius: 6px;
`

const IconContainer = styled.button`
  ${unselectable};
  all: unset;
  color: ${({ theme, disabled }) => (disabled ? theme.disabled : theme.contentSecondary)};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  justify-content: center;
  :hover {
    color: ${({ theme, disabled }) =>
    disabled ? theme.disabled : theme.contentBorderActive};
  }
  :active {
    color: ${({ theme, disabled }) => (disabled ? theme.disabled : theme.accent)};
  }
  > svg {
    color: inherit;
    height: 40px;
    width: 40px;
    transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  }
`

export default RecipientsInput
