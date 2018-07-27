import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { theme, Field, Info, TextInput, Button, DropDown } from '@aragon/ui'
//import { GraphQLClient } from 'graphql-request'

//const octokit = require('@octokit/rest')({
//  debug: true
//})

class NewIssuePanelContent extends React.Component {
  static propTypes = {
//    onHandleAddRepos: PropTypes.func.isRequired,
//    onHandleGitHubAuth: PropTypes.func.isRequired,
    github: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)
    //const { github } = this.props
    this.state = {
      repo: '',
      err: ''
    }
  }

  handleIssueSubmit = event => {
    event.preventDefault()
    const { onHandleAddRepos } = this.props
    const { reposToAdd } = this.state
    onHandleAddRepos(reposToAdd)
  }

  handleRepoSelect = index => {
    const { github } = this.props

    const newRepoId = index ?
      Object.keys(github.reposManaged)[index - 1] // because [0] == 'Choose Project'
      :
      'Choose Project'
    console.log('repo changed to ' + newRepoId)
    this.setState(newRepoId)
  }

  render() {
    const { github } = this.props
    const { err } = this.state
    const repos = github.reposManaged
    const reposNames = ['Choose Project', ...Object.keys(repos).map((repoId) => {return repos[repoId].name})]
    const activeRepoName = github.activeRepo ? repos[github.activeRepo].name : 'Choose Project'
    const activeRepoNameIndex = reposNames.indexOf(activeRepoName)

    return(
      <div>
        <Form onSubmit={this.handleLogin}>
          {
          (err) && (
            <Info background={theme.negative} title="Error">
              {err}
            </Info>
          )}

          <Field label="Project">
            <DropDown items={reposNames} active={activeRepoNameIndex} onChange={this.handleRepoSelect} />
          </Field>
          <Field label="Title">
            <TextInput
              onChange={this.handleTitleChange}
              required
              wide
            />
          </Field>
          <Field label="Description">
            <TextInput
              onChange={this.handleDescriptionChange}
              required
              wide
            />
          </Field>
          <Button mode="strong" type="submit" wide>
             Submit Issue 
          </Button>
        </Form>
      </div>
    )
  }

}

const Form = styled.form`
  margin-top: 20px;
`
export default NewIssuePanelContent

