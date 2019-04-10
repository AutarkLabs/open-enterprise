import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { IconRemove, TextInput, theme, unselectable, Button } from '@aragon/ui'

class DropDownOptionsInput extends React.Component {
  static propTypes = {
    input: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    values: PropTypes.array.isRequired,
    allOptions: PropTypes.array.isRequired,
  }

  addOption2 = () => {
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
  
  state = {
    showAddOption: false,
    addOptionText: '',
    found: [],
    editableItem: -1,
  }

  addOption = () => {
    this.setState({ showAddOption: true })
  }

  clearState = () => this.setState({ showAddOption: false, addOptionText: '', found: [], editableItem: -1 })

  addToCurated = issue => () => {
console.log('add', issue)
    this.props.onChange({
      target: { name, value:
        this.state.editableItem !== -1 ?
          this.props.values.splice(this.state.editableItem, 1, issue)
          :
          this.props.values.push(issue)
      },
    })
    this.clearState()
  }

  searchOptions = ({ target: { name, value } }) => {
    const found = this.props.allOptions.filter(
      issue => {
        if (!issue.title.includes(value) ||''.toString(issue.number).includes(value)) return false
        return (this.props.values.findIndex(i => i.id === issue.id) === -1)
        //return f
      }
    ).splice(0,10)
      
    this.setState({
      [name]: value,
      found
    })
  }

  removeOption = index => () => {
    this.props.onChange({
      target: { name, value: this.props.values.splice(index, 1) },
    })
    this.clearState()
  }

  onChangeInput = ({ target: { value } }) => {
    this.props.onChange({ target: { name: 'optionsInput', value } })
  }

  makeEditable = index => () => {
    this.setState({ editableItem: index })
  }

  issueToString = issue =>
    `${'repo' in issue ? issue.repo : issue.repository.name} #${issue.number} - ${issue.title}`


  renderEditable = () => (
    <div style={{position: 'relative'}}>
      <StyledInput
        wide
        autoFocus
        value={this.state.addOptionText}
        onChange={this.searchOptions} name="addOptionText"
        onBlur={() => { console.log('blur');this.clearState()}}
      />
      {(this.state.found.length > 0) && (
        <OptionsPopup>
          {this.state.found.map((issue, index) => {
            return (
              <IssueOption key={index} onClick={this.addToCurated(issue)}>
                {this.issueToString(issue)}
              </IssueOption>
            )
          }
          )}
        </OptionsPopup>
      )}
    </div>
  )

  renderReadOnly = (index, issue) => (
    <StyledInput
      onClick={this.makeEditable(index)}
      readOnly
      wide
      value={this.issueToString(issue)}
    />
  )

  render() {
    const { values } = this.props

    const loadOptions = values.length === 1 ? (
      <StyledOption>
        {this.state.editableItem === 0 ?
          this.renderEditable()
          :
          this.renderReadOnly(0, values[0])
        }
      </StyledOption>
    )
      : 
      values.map((issue, index) => {
        return (
          <StyledOption key={issue.id}>
            {this.state.editableItem !== index ?
              this.renderReadOnly(index, issue)
              :
              this.renderEditable()
            }
            <IconContainer
              style={{ transform: 'scale(.8)' }}
              onClick={this.removeOption(index)}
              title="Click to remove the issue"
              children={<IconRemove />}
            />
          </StyledOption>
        )
      })

    return (
      <Options>
        {loadOptions}
        {this.state.showAddOption ?
          this.renderEditable()
          :
          <div>
            <Button compact mode="secondary" onClick={this.addOption}>+ Add Another</Button>
          </div>
        }
      </Options>
    )
  }
}
const IssueOption = styled.div`
  padding: 5px;
  :hover {
    color: ${theme.accent};
  }
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  `

const BASE_HEIGHT = 32

const OptionsPopup = styled.div`
  overflow: hidden;
  position: absolute;
  top: ${BASE_HEIGHT + 5}px;
  width: 100%;
  right: 0;
  padding: 0;
  background: ${theme.contentBackground};
  border: 1px solid ${theme.contentBorder};
  border-radius: 0 0 3px 3px;
  z-index: 3;
  cursor: pointer;
`
const Options = styled.div`
  display: flex;
  flex-direction: column;
`
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
