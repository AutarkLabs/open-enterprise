import React from 'react'
import styled from 'styled-components'
import { Form, FormField, SettingsInput } from '../Form'
import { Text } from '@aragon/ui'
import CheckBox from '../Shared/CheckBox'

import { withGithub, GithubContext } from '../../context'
// import ApolloClient from 'apollo-boost'
// import { ApolloProvider } from 'react-apollo'

// const client = new ApolloClient({
//   uri: 'https://api.github.com/graphql',
//   request: operation => {
//     const token = localStorage.getItem('github_token')
//     if (token) {
//       operation.setContext({
//         headers: {
//           authorization: `Bearer ${token}`,
//         },
//       })
//     }
//   },
// })

class NewProject extends React.Component {
  state = {
    token: null,
    reposToAdd: {},
    // mock data. should be loaded up from contract
    reposFromServer: {
      42345: { name: 'test 1' },
      542678: { name: 'test 3' },
      3736: { name: 'test 4' },
      80268: { name: 'test 5' },
      99825: { name: 'test 6' },
    },
    reposManaged: {
      542678: 1,
      80268: 1,
    },
  }

  // componentDidMount() {
  //   const storedToken = localStorage.getItem('github_token')
  //   if (storedToken) {
  //     this.setState({
  //       token: storedToken,
  //       status: STATUS.AUTHENTICATED,
  //     })
  //     return
  //   }
  //   const code =
  //     window.location.href.match(/\?code=(.*)/) &&
  //     window.location.href.match(/\?code=(.*)/)[1]
  //   if (code) {
  //     this.setState({ status: STATUS.LOADING })
  //     fetch(`${AUTH_API_URI}${code}`)
  //       .then(response => response.json())
  //       .then(({ token }) => {
  //         localStorage.setItem('github_token', token)
  //         this.setState({
  //           token,
  //           status: STATUS.FINISHED_LOADING,
  //         })
  //       })
  //   }
  // }

  generateCheckboxHandler = repoId => {
    return checked => {
      const { reposToAdd, reposFromServer } = this.state
      if (!(repoId in reposToAdd)) {
        reposToAdd[repoId] = reposFromServer[repoId]
        this.setState({ reposToAdd: reposToAdd })
      } else {
        delete reposToAdd[repoId]
        this.setState({ reposToAdd: reposToAdd })
      }
    }
  }

  handleReposSubmit = () => {
    this.props.onCreateProject()
  }

  showRepos() {
    var reposDisplayList = []
    const { reposFromServer, reposManaged, reposToAdd } = this.state

    Object.keys(reposFromServer).forEach(repoId => {
      var repo = reposFromServer[repoId]
      const checkboxHandler = this.generateCheckboxHandler(repoId)
      reposDisplayList.push(
        <RepoListItem key={repoId}>
          <CheckBox
            key={repoId}
            // checked={repoId in reposManaged || repoId in reposToAdd}
            disabled={repoId in reposManaged}
            onClick={checkboxHandler}
          />
          <CheckBoxLabel size="small">{repo.name}</CheckBoxLabel>
        </RepoListItem>
      )
    })

    return (
      <div>
        <Text size="large">Which repos do you want to add?</Text>
        <Form onSubmit={this.handleReposSubmit} submitText="Finish">
          <RepoList>{reposDisplayList}</RepoList>
        </Form>
      </div>
    )
  }

  render() {
    // const { github } = this.props

    return this.showRepos()

    return (
      // <GithubContext.Consumer>
      //   {({ login }) => <div>Hello {login}</div>}
      // </GithubContext.Consumer>
      // <div>Hello {github.login}</div>
      <div>New project</div>
      // <ApolloProvider client={client}>
      //   <a
      //     style={{
      //       display: this.state.status === STATUS.INITIAL ? 'inline' : 'none',
      //     }}
      //     href={`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=user&redirect_uri=${REDIRECT_URI}`}
      //   >
      //     Login
      //   </a>
      // </ApolloProvider>
    )
  }
}

const RepoList = styled.ul`
  list-style-type: none;
`
const RepoListItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`
const CheckBoxLabel = styled(Text)`
  font-size: 14px;
  margin-left: 5px;
`

// export default withGithub(NewProject)
export default NewProject
