import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Button, IconPlus, IconRemove, TextInput, useTheme, unselectable } from '@aragon/ui'

const OptionsInput = ({
  options,
  onChange,
}) => {
  const theme = useTheme()

  const changeOption = (value, id) => {
    onChange({
      target: { name: 'optionsChange', value, id },
    })
  }

  const addOption = () => {
    onChange({
      target: {
        name: 'optionsAdd',
        value: true,
      }
    })
  }

  const removeOption = id => {
    onChange({
      target: {
        name: 'optionsRemove',
        id,
      }
    })
  }

  return (
    <div>
      <div style={flexColumn}>
        { Object.keys(options)
          .map((id, index) => {
            return (
            <StyledOption key={id}>
              <TextInput
                value={options[id]}
                onChange={v => changeOption(v.target.value, id)}
                wide
                autofocus={index !== 0}
              />
              { Object.keys(options).length > 1 && (
                <IconContainer
                  theme={theme}
                  style={{ transform: 'scale(.8)' }}
                  onClick={() => removeOption(id)}
                  title="Remove this option"
                >
                  <IconRemove />
                </IconContainer>
              )}
            </StyledOption>
          )}
        )}
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
        onClick={addOption}
      />
    </div>
  )
}

OptionsInput.propTypes = {
  options: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

const flexColumn = { display: 'flex', flexDirection: 'column' }

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
  display: flex;
  justify-content: center;
  ${({ disabled, theme }) => (disabled ? `
      color: ${theme.disabled};
      cursor: not-allowed;
    ` : `
      color: ${theme.contentSecondary};
      cursor: pointer;
      :hover {
        color: ${theme.surfaceOpened};
      }
      :active {
        color: ${theme.accent};
      }
    `)
}
  > svg {
    color: inherit;
    height: 40px;
    width: 40px;
    transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  }
`

export default OptionsInput
