import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { theme, Text, Field, Info, TextInput, Button } from '@aragon/ui'
import { GraphQLClient } from 'graphql-request'

//const octokit = require('@octokit/rest')({
//  debug: true
//})

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
      token: git.token,
      err: ''
    }
  }

/*    const query = `{
      user(login:"` + login + `") {
        repositories(first:10,affiliations:[OWNER,COLLABORATOR,ORGANIZATION_MEMBER]) {
          edges {
            node {
              refs (first:10,refPrefix: "refs/heads/"){
                edges {
                  node {
                    name
                    target {
                      ... on Commit {
                        id
                        history(first: 0) {
                          totalCount
                        }
                      }
                    }
                  }
                }
              }
              issues(first:3) {
                totalCount
              }
              name
              id
              collaborators(first:3) {
                totalCount
                edges {
                  node {
                    id
                    login
                  }
                }
              }
            }
          }
        }
      }
    }`
*/
  getRepos = (client, login) => {
    const query = `{
      user(login:"` + login + `") {
        repositories(first:10,affiliations:[OWNER,COLLABORATOR,ORGANIZATION_MEMBER]) {
          edges {
            node {
              refs (first:10,refPrefix: "refs/heads/"){
                edges {
                  node {
                    name
                    target {
                      ... on Commit {
                        history(first: 0) {
                          totalCount
                        }
                      }
                    }
                  }
                }
              }
              issues(first:3) {
                totalCount
              }
              name
              collaborators(first:3) {
                totalCount
              }
            }
          }
        }
      }
    }`

    client.request(query)
      .then(data => {
        console.log(data)
        this.processRepos(data)
      })
      .catch(err => this.setState({ err: err.message }))
  }

  processRepos = data => {
    var reposFromServer = {}
    
    data.user.repositories.edges.map(
      rNode => {
        var commits = 0
        rNode.node.refs.edges.map(
          refNode => {
            commits += refNode.node.target.history.totalCount
        })

        reposFromServer[rNode.node.name] = {
          collaborators: rNode.node.collaborators.totalCount,
          commits: commits
        }
        console.log ('adding ' + rNode.node.name, reposFromServer)
    })
    this.setState({ reposFromServer: reposFromServer })
  }

  handleLogin = event => {
    // would be nice to include some filtering/validating
    event.preventDefault()

    const { token } = this.state
    if ((token.length !== 40) || (/^[a-zA-Z0-9]+$/.test(token) == false)) {
      this.setState({ err: 'Invalid token' })
      return
    }

    const client = new GraphQLClient(
      'https://api.github.com/graphql',
      {
        headers: {
          Authorization: 'Bearer ' + token,
        }
      }
    )

    const whoami = `{
      viewer {
        id
        login
        avatarUrl
      }
    }`

    client.request(whoami)
      .then(data => {
        console.log(data)
        this.setState({
          isAuthenticated: true,
          login: data.viewer.login,
          avatarUrl: data.viewer.avatarUrl
        })
        this.getRepos(client, data.viewer.login)
      })
      .catch(err => this.setState({ err: err.message }))

/*
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
*/
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

    for (var repoName in reposFromServer) {
      if (Object.prototype.hasOwnProperty.call(reposFromServer, repoName)) {
        var repo = reposFromServer[repoName]
        const checkboxHandler = this.generateCheckboxHandler(repoName)
        reposDisplayList.push(
          <li key={repoName}>
            {
            (repoName in reposManaged) ? 
            <input type="checkbox" onChange={checkboxHandler} checked disabled />
            :
            <input type="checkbox" onChange={checkboxHandler} />
            }
            <Text>
              {repoName}
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

