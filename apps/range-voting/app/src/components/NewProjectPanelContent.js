import React from 'react'
import styled from 'styled-components'
import { Button, Info, TextInput, DropDown, Field } from '@aragon/ui'

const initialState = {
  projectName: '',
  description: '',
  repoURL: '',
  bountySystem: '',
}

class NewProjectPanelContent extends React.Component {
  static defaultProps = {
    onCreateProject: () => {},
  }
  state = {
    ...initialState,
  }

  constructor(props) {
    super(props)
    this.handleNameChange = this.createChangeHandler('projectName')
    this.handleDescriptionChange = this.createChangeHandler('description')
    this.handleRepoURLChange = this.createChangeHandler('repoURL')
  }

  componentWillReceiveProps({ opened }) {
    if (opened && !this.props.opened) {
      // setTimeout is needed as a small hack to wait until the input's on
      // screen until we call focus
      this.projectNameInput && setTimeout(() => this.projectNameInput.focus(), 0)
    } else if (!opened && this.props.opened) {
      // Finished closing the panel, so reset its state
      this.setState({ ...initialState })
    }
  }

  createChangeHandler(name) {
    return event => {
      this.setState({[name]: event.target.value})
    }
  }
  handleBountySystemChange = index => {
     this.setState({'bountySystem': index})
  }

  handleSubmit = event => {
    // would be nice to include some filtering/validating
    event.preventDefault()
    this.props.onCreateProject(this.state.projectName.trim())
  }
  render() {
    const { projectName, description, repoURL, bountySystem } = this.state
    const bountySystemItems = ['Status Open Bounty', 'Gitcoin', 'Bounties Network']
    return (
      <div>
        <Form onSubmit={this.handleSubmit}>
          <Field label="Name">
            <TextInput
              value={projectName}
              onChange={this.handleNameChange}
              required
              wide
            />
          </Field>
          <Field label="Description">
            <TextInput
              value={description}
              onChange={this.handleDescriptionChange}
              required
              wide
            />
          </Field>
          <Field label="Repo URL">
            <TextInput
              value={repoURL}
              onChange={this.handleRepoURLChange}
              required
              wide
            />
          </Field>
          <Field label="bountySystem">
            <DropDown
              items={bountySystemItems}
              active={bountySystem}
              onChange={this.handleBountySystemChange}
              required
              wide
            />
          </Field>
          <Button mode="strong" type="submit" wide>
            Create Project
          </Button>
        </Form>
      </div>
    )
  }
}

const Form = styled.form`
  margin-top: 20px;
`

export default NewProjectPanelContent

