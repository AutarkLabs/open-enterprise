import React from 'react'
import PropTypes from 'prop-types'
import { useMutation } from '@apollo/react-hooks'
import { Mutation } from 'react-apollo'
import { useAragonApi } from '../../../api-react'
import { Field, GU, TextInput, DropDown } from '@aragon/ui'
import { NEW_ISSUE } from '../../../utils/gql-queries.js'
import { Form } from '../../Form'
import { LoadingAnimation } from '../../Shared'
import { usePanelManagement } from '../../Panel'
import { useDecoratedRepos } from '../../../context/DecoratedRepos'
import AuthorizeGitHub from './AuthorizeGitHub'
import { ipfsAdd } from '../../../utils/ipfs-helpers'

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
      marginTop: 3 * GU,
    }}
  >
    <LoadingAnimation style={{ marginBottom: '32px' }} />
    Creating issue...
  </div>
)

class NewIssue extends React.PureComponent {
  state = NewIssue.initialState
  static propTypes = {
    account: PropTypes.string,
    closePanel: PropTypes.func.isRequired,
    graphqlMutation: PropTypes.array,
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
    const { title, description, selectedProject } = this.state
    const { reposManaged, issues, repoHexIds, api } = this.props
    const {
      projectChange,
      titleChange,
      descriptionChange,
    } = this

    const items =
      typeof reposManaged === 'string'
        ? 'No repos'
        : [ 'Select a project', ...reposManaged.map(repo => repo.name) ]

    const reposIds =
      typeof reposManaged === 'string' ? [] : reposManaged.map(repo => repo.id)

    const id = selectedProject > 0 ? reposIds[selectedProject - 1] : ''

    const handleSubmit = async e => {
      e.preventDefault()
      const newIssueData = {
        number: issues.filter(i => i.id === repoHexIds[selectedProject - 1]).length,
        id: repoHexIds[selectedProject - 1],
        title,
        body: description,
        author: {
          login: this.props.account,
        },
        repository: reposManaged[selectedProject - 1],
        labels: { totalCount: 0, edges: Array(0) },
        milestone: null,
        state: 'OPEN',
        url: null
      }
      const hashedIssueData = await ipfsAdd(newIssueData)
      api.setIssue(newIssueData.id, newIssueData.number, hashedIssueData).toPromise()
    }

    // TODO: refetch Issues list after mutation
    const [ newIssue, { loading, error }] = this.props.graphqlMutation

    if (loading) return <Creating />

    if (error) return <div css={`margin-top: ${3 * GU}px`}>Error</div>

    return (
      <Form
        css={`margin-top: ${3 * GU}px`}
        onSubmit={async () => {
          await newIssue({ variables: { title, description, id } })
          this.props.closePanel()
        }}
        submitText="Submit Issue"
        submitDisabled={this.canSubmit()}
      >
        <Field label="Project">
          <DropDown
            items={items}
            selected={selectedProject}
            onChange={projectChange}
            wide
            required
          />
        </Field>
        {selectedProject > 0 && (reposManaged[selectedProject - 1].decoupled ? (
          /* Repo is Decoupled */
          <Form
            onSubmit={handleSubmit}
            submitText="Submit Issue"
            submitDisabled={this.canSubmit()}
          >
            <Field label="Title">
              <TextInput onChange={titleChange} required wide />
            </Field>
            <Field label="Description">
              <TextInput.Multiline
                rows={3}
                style={{
                  resize: 'none',
                  height: 'auto',
                  paddingTop: '5px',
                  paddingBottom: '5px',
                }}
                onChange={descriptionChange}
                wide
              />
            </Field>
          </Form>
        ) : ( 
          /* repo is connected to github */
          <Mutation
            mutation={NEW_ISSUE}
            variables={{ title, description, id }}
            onError={console.error}
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
                    <Field label="Title">
                      <TextInput onChange={titleChange} required wide />
                    </Field>
                    <Field label="Description">
                      <TextInput.Multiline
                        rows={3}
                        style={{
                          resize: 'none',
                          height: 'auto',
                          paddingTop: '5px',
                          paddingBottom: '5px',
                        }}
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
              }
              return null
            }}
          </Mutation>
        ))}
      </Form>
    )
  }
}

// TODO: move entire component to functional component
// the following was a quick way to allow us to use hooks
const NewIssueWrap = () => {
  const { closePanel } = usePanelManagement()
  const repos = useDecoratedRepos()
  const { appState: { github, issues }, api, connectedAccount } = useAragonApi()

  const graphqlMutation = useMutation(NEW_ISSUE, {
    onError: console.error,
    refetchQueries: ['SearchIssues'], // TODO: doesn't work; needs delay before refetch
  })

  if (!github.scope) return <AuthorizeGitHub />

  const repoNames = repos
    ? repos.map(repo => ({
      name: repo.metadata.name,
      id: repo.data._repo,
      hexId: repo.id,
      decoupled: repo.decoupled
    }))
    : 'No repos'
  const reposIds = (repos || []).map(repo => repo.data._repo)
  const repoHexIds = (repos || []).map(repo => repo.id)

  return (
    <NewIssue
      api={api}
      account={connectedAccount}
      issues={issues}
      closePanel={closePanel}
      graphqlMutation={graphqlMutation}
      reposManaged={repoNames}
      reposIds={reposIds}
      repoHexIds={repoHexIds}
    />
  )
}

export default NewIssueWrap
