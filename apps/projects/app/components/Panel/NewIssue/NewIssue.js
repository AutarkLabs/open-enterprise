import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Mutation } from 'react-apollo'
import { gql } from 'apollo-boost'
import { theme, Field, Info, TextInput, Button, DropDown } from '@aragon/ui'
import { NEW_ISSUE, GET_ISSUES } from '../../../utils/gql-queries.js'
import { Form } from '../../Form'
import { LoadingAnimation } from '../../Shared'

// TODO: labels
// TODO: import validator from '../data/validation'

const Creating = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      flexDirection: 'column',
    }}
  >
    <LoadingAnimation style={{ marginBottom: '32px' }} />
    Creating issue...
  </div>
)

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

  canSubmit = () => !(this.state.title !== '' && this.state.selectedProject > 0)

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
        : [ 'Select a project', ...reposManaged.map(repo => repo.name) ]
    
    const reposIds =
      typeof reposManaged === 'string'
        ? []
        : reposManaged.map(repo => repo.id)
    
    const id = selectedProject > 0 ? reposIds[selectedProject - 1] : ''

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
              <Form
                onSubmit={newIssue}
                submitText="Submit Issue"
                submitDisabled={this.canSubmit()}
              >
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
                    style={{ resize: 'none', height: 'auto', paddingTop: '5px', paddingBottom: '5px' }}
                    onChange={descriptionChange}
                    wide
                  />
                </Field>
              </Form>
            )
          } // end if(!called)
          if (loading) {
            return <Creating />
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
