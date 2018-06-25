import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { theme, Text, Field, Info, TextInput, Button } from '@aragon/ui'
import { GraphQLClient } from 'graphql-request'
import CheckboxInput from '../Checkbox'

//const octokit = require('@octokit/rest')({
//  debug: true
//})

class NewProjectPanelContent extends React.Component {
  static propTypes = {
    onHandleAddRepos: PropTypes.func.isRequired,
    onHandleGitHubAuth: PropTypes.func.isRequired,
    github: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props)
    const { github } = this.props
    this.state = {
      reposFromServer: {},
      reposToAdd: {},
      reposManaged: github.reposManaged,
      authToken: github.authToken, // <App> is allowed to know better
      err: ''
    }
  }

/*

For each chosen repo Issues shouild be downloaded separately.
However, for simplicity's sake, and thanks to graphql, downloading
repositories with issues list included is not going to cost much.

  getIssues = (client, repoName, ownerLogin) => {
    const query = `{
      repository(owner: "` + ownerLogin + `", name: "` + repoName + `") {
        id
        issues(first: 3) {
          totalCount
          edges {
            node {
              id
              title
              state
              url
              labels(first: 10) {
                totalCount
                edges {
                  node {
                    id
                    name
                    description
                    color
                    url
                  }
                }
              }
            }
          }
        }
      }
    }`

    client.request(query)
      .then(data => {
        console.log(data)
        this.processIssues(data)
      })
      .catch(err => this.setState({ err: err.message }))
  }
*/

  getRepos = (client, login) => {
    const query = `{
      user(login:"` + login + `") {
        repositories(first:20,affiliations:[OWNER,COLLABORATOR,ORGANIZATION_MEMBER]) {
          edges {
            node {
              id
              name
              description
              url
              owner {
                id
                login
              }
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
              issues(first:10) {
                totalCount
                edges {
                  node {
                    id
                    title
                    state
                    url
                    createdAt
                    number
                    repository {
                      id
                      name
                      nameWithOwner
                    }
                    milestone {
                      id
                      title
                      url
                      description
                    }
                    labels(first: 10) {
                      totalCount
                      edges {
                        node {
                          id
                          name
                          description
                          color
                          url
                        }
                      }
                    }
                  }
                }
              }
              collaborators(first:1) {
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

  processRepos(data) {
    var reposFromServer = {}
    // this is a placeholder just to have the bounties work in the simplest fashion.
    const BountyLabels = {
      'bounty_xs': 'xs',
      'bounty_s': 's',
      'bounty_m': 'm',
      'bounty_l': 'l',
      'bounty_xl': 'xl'
    }

    data.user.repositories.edges.forEach(
      rNode => {
        var commits = 0
        rNode.node.refs.edges.forEach(
          refNode => {
            commits += refNode.node.target.history.totalCount
        })

        const labels = {}
        const milestones = {}

        rNode.node.issues.edges.forEach(
          issue => {
            issue.node.bounty = ''
            if (issue.node.labels.totalCount > 0) {
              issue.node.labels.edges.forEach(
                label => {
                  if (label.node.name in BountyLabels) {
                    issue.node.bounty = BountyLabels[label.node.name]
                  } else {
                    labels[label.node.id] = label.node
                  }
                }
              )
            }
            if (issue.node.milestone) {
              milestones[issue.node.milestone.id] = issue.node.milestone
            }
          }
        )
        reposFromServer[rNode.node.id] = {
          name: rNode.node.name,
          description: rNode.node.description,
          url: rNode.node.url,
          collaborators: rNode.node.collaborators.totalCount,
          commits: commits,
          ownerLogin: rNode.node.owner.login,
          issues: rNode.node.issues.edges,
          labels: labels,
          milestones: milestones
        }
        //console.log ('adding ' + rNode.node.name, reposFromServer)
        //console.log('labels: ',labels)
        //console.log('milestones: ',milestones)
        return
    })
    this.setState({ reposFromServer: reposFromServer })
  }

  handleLogin = event => {
    event.preventDefault()

    const { authToken } = this.state
    if ((authToken.length !== 40) || (/^[a-zA-Z0-9]+$/.test(authToken) === false)) {
      this.setState({ err: 'Invalid token' })
      return
    }

    const client = new GraphQLClient(
      'https://api.github.com/graphql',
      {
        headers: {
          Authorization: 'Bearer ' + authToken,
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
        const { onHandleGitHubAuth } = this.props
        this.getRepos(client, data.viewer.login)
        // below: <App> is getting notified about successful login
        onHandleGitHubAuth(authToken, data.viewer.login, data.viewer.avatarUrl)
      })
      .catch(err => this.setState({ err: err.message }))
  }

  handleReposSubmit = event => {
    event.preventDefault()
    const { onHandleAddRepos } = this.props
    const { reposToAdd } = this.state
    onHandleAddRepos(reposToAdd)
  }

  generateCheckboxHandler = repoId => {
    return isChecked => {
      const { reposToAdd, reposFromServer } = this.state
      if (isChecked) {
        reposToAdd[repoId] = reposFromServer[repoId]
        this.setState({ reposToAdd: reposToAdd })
      } else {
        delete reposToAdd[repoId]
        this.setState({ reposToAdd: reposToAdd })
      }
    }
  }

  showRepos() {
    var reposDisplayList = []
    const { reposFromServer, reposManaged, reposToAdd } = this.state

    Object.keys(reposFromServer).forEach((repoId) => {
      var repo = reposFromServer[repoId]
      const checkboxHandler = this.generateCheckboxHandler(repoId)
      reposDisplayList.push(
        <li key={repoId}>
          <CheckboxInput
            isChecked={repoId in reposManaged || repoId in reposToAdd}
            isDisabled={repoId in reposManaged}
            onClick={checkboxHandler}
            label={repo.name}
          />
        </li>
      )
    })

    return(
      <div>
        <Text size='large'>Which repos do you want to add?</Text>
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
    this.setState({ authToken: event.target.value, err: '' })
  }

  authenticate() {
    const { authToken, err } = this.state
    return(
      <div>
        <Text size='large'>Sign in with GitHub to start managing your repos with Aragon</Text>
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
          <Field label="Personal Token">
            <TextInput
              value={authToken}
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
    const { github } = this.props

    if (github.isAuthenticated) {
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
