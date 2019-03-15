import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { IconAdd, IconRemove, TextInput, theme, unselectable } from '@aragon/ui'

class DropDownOptionsInput extends React.Component {
  static propTypes = {
    input: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    values: PropTypes.array.isRequired,
  }

  addOption = () => {
    // TODO: Implement some rules about what an 'Option can be' duplicates, etc
    const { input, name, values } = this.props
    if (input && !values.includes(input)) {
      this.props.onChange({ target: { name, value: [ ...values, input ] } })
      this.props.onChange({ target: { name: 'optionsInput', value: '' } })
      console.log('Option Added')
    } else {
      console.log(
        'DropDownOptionsInput: The option is empty or already present'
      )
    }
  }

  removeOption = option => {
    this.props.onChange({
      target: { name, value: values.filter(v => v !== option) },
    })
  }

  onChangeInput = ({ target: { value } }) => {
    this.props.onChange({ target: { name: 'optionsInput', value } })
  }

  render() {
    const loadOptions = this.props.values.map(issue => {
      const { repo, number, title } = issue
      const issueString = `${repo} #${number} - ${title}`
      return (
        <StyledOption key={issue.id}>
          <StyledInput readOnly wide value={issueString} />
          <IconContainer
            style={{ transform: 'scale(.8)' }}
            onClick={() => removeOption(issue)}
            title="Click to remove the issue"
            children={<IconRemove />}
          />
        </StyledOption>
      )
    })

    return <div style={flexColumn}>{loadOptions}</div>
  }
}

const flexColumn = { display: 'flex', flexDirection: 'column' }

const StyledOption = styled.div`
  display: flex;
  margin-bottom: 0.625rem;
  > :first-child {
    flex-grow: 1;
  }
`

const StyledInput = styled(TextInput)`
  flex-grow: 1;
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

const IconContainer = styled.span`
  cursor: pointer;
  display: flex;
  justify-content: center;
  > svg {
    color: ${theme.textSecondary};
    height: auto;
    width: 40px;
    transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    :active {
      color: ${theme.accent};
    }
    :hover {
      color: ${theme.contentBorderActive};
    }
  }
`

export default DropDownOptionsInput
