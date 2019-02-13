import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Mutation } from 'react-apollo'
import { gql } from 'apollo-boost'
import { theme, Field, Info, TextInput, Button, DropDown } from '@aragon/ui'
import { NEW_ISSUE, GET_ISSUES } from '../../../utils/gql-queries.js'

// TODO: labels
// TODO: import validator from '../data/validation'

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 20px;
  > :last-child {
    margin-top: 20px;
  }
`

class NewIssue extends React.PureComponent {
  state = NewIssue.initialState
  static propTypes = {
    reposManaged: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
          id: PropTypes.string,
        })
      ),
    ]).isRequired, // array of managed repos
  }

  static initialState = {
    selectedProject: 0,
    project: 0,
    title: '',
    description: '',
    labels: '', // TODO: Change to array
  }

  // static validate = validator.compile({

  // })

  componentDidUpdate(prevProps, prevState) {
    if (this.state !== prevState) {
      const state = { ...this.state }

      this.setState({
        ...state,
        // isValid: NewIssue.validate(state)
      })
    }
  }

  // focusFirstEmptyField = () => {
  //   const { project, title, description, labels } = this.state

  //   // if (!project) {
  //   //   this.entitySearch.input.focus()
  //   // } else if (!salary) {
  //   //   this.salaryInput.focus()
  //   // }
  // }

  // handleEntityChange = (accountAddress, entity) => {
  //   this.setState({ entity }, () => {
  //     this.focusFirstEmptyField()
  //   })
  // }

  formSubmit = event => {
    event.preventDefault()

    console.log('form submitted:', this.state)
    // TODO: change to status.loading animation

    // const { onHandleAddRepos } = this.props
    // const { reposToAdd } = this.state
    // onHandleAddRepos(reposToAdd)
  }

  projectChange = index => {
    this.setState({ selectedProject: index })
  }

  titleChange = e => {
    this.setState({ title: e.target.value })
  }

  descriptionChange = e => {
    this.setState({ description: e.target.value })
  }

  labelsChange = e => {
    this.setState({ labels: e.target.value })
  }

  // handlePanelToggle = (opened) => {
  //   if (opened) { // When side panel is shown
  //     this.focusFirstEmptyField()
  //   }
  // }

  render() {
    const {
      title,
      description,
      labels,
      isValid,
      selectedProject,
    } = this.state
    const { reposManaged } = this.props
    const {
      projectChange,
      titleChange,
      descriptionChange,
      labelsChange,
      formSubmit,
    } = this

    const items =
      typeof reposManaged === 'string'
        ? 'No repos'
        : reposManaged.map(repo => repo.name)
    
    const reposIds =
      typeof reposManaged === 'string'
        ? []
        : reposManaged.map(repo => repo.id)
    
    const id = reposIds[selectedProject]

    const reGet = [{
      query: GET_ISSUES,
      variables: { reposIds }
    }]

    return (
      <Mutation
        mutation={NEW_ISSUE}
        refetchQueries={reGet}
        variables={{ title, description, id }}
        onError={() => {
          console.error
        }}
      >
        {(newIssue, result) => {
          const { data, loading, error, called } = result
          if (!called) {
            return (
              <Form onSubmit={formSubmit}>
                <Field label="Project">
                  <DropDown
                    items={items}
                    active={selectedProject}
                    onChange={projectChange}
                    wide
                    required
                  />
                </Field>
                <Field label="Title">
                  <TextInput onChange={titleChange} required wide />
                </Field>
                <Field label="Description">
                  <TextInput.Multiline
                    rows={3}
                    style={{ resize: 'none', height: 'auto' }}
                    onChange={descriptionChange}
                    wide
                  />
                </Field>
                <Field label="Labels">
                  <TextInput onChange={labelsChange} wide />
                </Field>
                <Button mode="strong" onClick={newIssue} wide>
                  Submit Issue
                </Button>
              </Form>
            )
          } // end if(!called)
          if (loading) {
            return <div>Loading...</div>
          }
          if (error) {
            return <div>Error</div>
          }

          const { createIssue } = data
          if (createIssue) {
            this.props.closePanel()
            return null
          } else return null
        }}
      </Mutation>
    )
  }
}

export default NewIssue
