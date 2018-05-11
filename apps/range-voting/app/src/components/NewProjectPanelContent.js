import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { theme, Text, Field, Info, TextInput, Button } from '@aragon/ui'

const octokit = require('@octokit/rest')({
  debug: true
})

class NewProjectPanelContent extends React.Component {
  static propTypes = {
    onHandleAddRepos: PropTypes.func.isRequired,
    git: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)
    const { git } = this.props
    this.state = {
      reposFromServer: {},
      reposToAdd: {},
      reposManaged: git.reposManaged,
      isAuthenticated: false,
      token: '',
      err: ''
    }
  }

  processRepos = result => {
    this.setState({ reposFromServer: result.data })
  }

  handleLogin = event => {
    // would be nice to include some filtering/validating
    event.preventDefault()

    const { token } = this.state
    if ((token.length !== 40) || (/^[a-zA-Z0-9]+$/.test(token) == false)) {
      this.setState({ err: 'Invalid token' })
      return
    }

   octokit.authenticate({
      type: 'oauth',
      token: token
    })

    octokit.repos.getAll({})
    .then(result => {
      if (octokit.hasNextPage(result)) {
        return octokit.getNextPage(result)
        .then(this.processRepos(result))
      }
      this.processRepos(result)
      this.setState({ isAuthenticated: true })
    })
    .catch (err => this.setState({ err: err.message }))
  }

  handleReposSubmit = event => {
    event.preventDefault()
    const { onHandleAddRepos } = this.props
    const { reposToAdd } = this.state
    onHandleAddRepos(reposToAdd)
  }

  generateCheckboxHandler = index => {
    return event => {
      console.log('toggled: ' + index + ', ' + event.target.checked)
      const { reposToAdd, reposFromServer } = this.state
      if (event.target.checked) {
        reposToAdd[index] = reposFromServer[index]
        this.setState({ reposToAdd: reposToAdd })
      } else {
        delete reposToAdd[index]
        this.setState({ reposToAdd: reposToAdd })
      }
    }
  }

  showRepos() {
    var reposDisplayList = []
    const { reposFromServer, reposManaged } = this.state

    for (var index in reposFromServer) {
      if (Object.prototype.hasOwnProperty.call(reposFromServer, index)) {
        var repo = reposFromServer[index]
        const checkboxHandler = this.generateCheckboxHandler(index)
        reposDisplayList.push(
          <li key={index}>
            {
            (repo.name in reposManaged) ? 
            <input type="checkbox" onChange={checkboxHandler} checked disabled />
            :
            <input type="checkbox" onChange={checkboxHandler} />
            }
            <Text>
              {repo.name}
            </Text>
          </li>
         )
       }
    }

    return(
      <div>
        <Text>Which repos do you want to add?</Text>
        <Form onSubmit={this.handleReposSubmit}>
          <RepoList>
            {reposDisplayList}
          </RepoList>
          <Button mode="strong" type="submit" wide>
             Finish
          </Button>
        </Form>
      </div>
    )
  }

  handleTokenChange = event => {
    this.setState({ token: event.target.value, err: '' })
  }

  authenticate() {
    const { token, err } = this.state
    return(
      <div>
        Sign in with GitHub to start managing your repos with Aragon
        <ul>
          <li>Prioritize your backlog</li>
          <li>Reach consensus on issue valuations</li>
          <li>Allocate bounties to multiple issues</li>
        </ul>
        <Form onSubmit={this.handleLogin}>
          {
          (err) && (
            <Info background={theme.negative} title="Error">
              {err}
            </Info>
          )}
          <Field label="Token">
            <TextInput
              value={token}
              onChange={this.handleTokenChange}
              required
              wide
            />
          </Field>
          <Button mode="strong" type="submit" wide>
             Sign in with GitHub 
          </Button>
        </Form>
      </div>
    )
  }

  render() {
    const { isAuthenticated } = this.state

    if (isAuthenticated) {
      return this.showRepos()
    } else {
      return this.authenticate()
    }
  }
}

const Form = styled.form`
  margin-top: 20px;
`
const RepoList = styled.ul`
  list-style-type: none;
`
export default NewProjectPanelContent

