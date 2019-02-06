import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { IconAdd, TextInput, theme, unselectable } from '@aragon/ui'
import IconRemove from '../../../assets/components/IconRemove'

const {
  disabled,
  contentBackgroundActive,
  contentBorderActive,
  contentBorder,
  textSecondary,
} = theme

class DropDownOptionsInput extends React.Component {
  static propTypes = {
    input: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
  }

  addOption = () => {
    // TODO: Implement some rules about what an 'Option can be' duplicates, etc
    const { input, name, value } = this.props
    if (input && !value.includes(input)) {
      this.props.onChange({ target: { name, value: [...value, input] } })
      this.props.onChange({ target: { name: 'optionsInput', value: '' } })
      console.log('Option Added')
    } else {
      console.log(
        'DropDownOptionsInput: The option is empty or already present'
      )
    }
  }

  removeOption = option => {
    const { name, value } = this.props
    let index = value.indexOf(option)
    // Double exclamation to make sure is reemoved
    !!value.splice(index, 1) &&
      this.props.onChange({
        target: { name, value },
      })
    console.log('Option Removed', option, this.props.value)
  }

  onChangeInput = ({ target: { value } }) => {
    this.props.onChange({ target: { name: 'optionsInput', value } })
  }

  render() {
    const loadOptions = this.props.value.map(issue => {
      const { repo, number, title } = issue
      const issueString = `${repo} #${number} - ${title}`
      return (
        <div className="option" key={issue.id}>
          <StyledInput readOnly wide value={issueString} />
          <IconRemove onClick={() => this.removeOption(issue)} />
        </div>
      )
    })

    return (
      <StyledOptionsInput empty={!this.props.input.length}>
        {loadOptions}
        {/* TODO: Implement selecting more issues from the Panel: */}
        {/* <div className="option">
          <StyledInput
            placeholder={this.props.placeholder}
            value={this.props.input}
            onChange={this.onChangeInput}
          />
          <IconAdd onClick={this.addOption} />
        </div> */}
      </StyledOptionsInput>
    )
  }
}

const StyledInput = styled(TextInput)`
  ${unselectable}; /* it is possible to select the placeholder without this */
  ::placeholder {
    color: ${theme.contentBorderActive};
  }
  :focus {
    border-color: ${contentBorderActive};
    ::placeholder {
      color: ${contentBorderActive};
    }
  }
  :read-only {
    cursor: default;
    :focus {
      border-color: ${contentBorder};
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
      color: ${({ empty }) => (empty ? disabled : textSecondary)};
      vertical-align: middle;
      transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
      :hover {
        color: ${({ empty }) => (empty ? disabled : contentBorderActive)};
      }
      :active {
        color: ${({ empty }) => (empty ? disabled : contentBackgroundActive)};
      }
    }
  }
`

// > svg {
/* cursor not really needed here */
/* cursor: ${({ empty }) => (empty ? 'not-allowed' : 'pointer')}; */
// }

export default DropDownOptionsInput
