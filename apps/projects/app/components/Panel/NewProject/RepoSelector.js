import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, GU, IconSearch, Info, RadioList, Text, TextInput, theme } from '@aragon/ui'
import { GET_REPOSITORIES } from '../../../utils/gql-queries.js'
import { LoadingAnimation } from '../../Shared'
import { Query } from 'react-apollo'
import { useAragonApi } from '../../../api-react'
import { usePanelManagement } from '../../Panel'
import { toHex } from 'web3-utils'
import noResultsSvg from '../../../assets/noResults.svg'

const UNSELECT = {
  repoSelected: -1,
  project: '',
  owner: '',
}

class Repo extends React.Component {
  state = {
    repos: [],
    filteredRepos: [],
    filtered: false,
    filter: '',
    project: '',
    repoSelected: -1,
  }

  filterAlreadyAdded = repos => {
    return repos.filter(repo => !this.props.reposAlreadyAdded.includes(repo.node.id))
  }

  // TODO: use observables
  searchRepos = (queryRepos) => e => {
    const repos = queryRepos.filter(repo => {
      if (repo.node.nameWithOwner.indexOf(e.target.value) > -1) {
        return repo
      }
      return null
    })

    this.setState({
      filter: e.target.value,
      filteredRepos: repos,
      filtered: true,
      ...UNSELECT,
    })
  }

  handleClearSearch = () => {
    // TODO: initial state
    this.setState(prevState => ({
      filter: '',
      filtered: false,
      filteredRepos: prevState.repos,
      ...UNSELECT,
    }))
  }

  handleNewProject = () => {
    const { project } = this.state
    if (project.length > 0) this.props.onCreateProject({ project })
  }

  onRepoSelected = repoArray => i => {
    this.setState({
      repoSelected: i,
      project: repoArray[i].node.id,
      owner: repoArray[i].node.owner.id,
    })
  }

  unselect = () => this.setState({})

  // if there are visible (with or tiwhout filtration) repos, show them
  // else if there are no repos to show but filtering is active - show "no match"
  // else there are no repos to add (possibly all that could have been added
  // already are
  repoList = (visibleRepos, repoArray) => visibleRepos.length > 0 ? (
    <RadioList
      items={repoArray}
      selected={this.state.repoSelected}
      onChange={this.onRepoSelected(repoArray)}
    />
  ) : this.state.filter ? (
    <RepoInfo>
      <img css={`margin-bottom: ${2 * GU}px`} src={noResultsSvg} alt=""  />
      <Text.Block style={{ fontSize: '28px', marginBottom: '8px' }}>
        No results found.
      </Text.Block>
      <Text.Block>
        We can&#39;t find any items mathing your search.
      </Text.Block>
      <Button
        size="mini"
        onClick={this.handleClearSearch}
        css={`
            margin-left: 8px;
            border: 0;
            box-shadow: unset;
            padding: 4px;
          `}
      >
        <Text size="small" color={`${theme.badge}`}>
            Clear Filters
        </Text>
      </Button>
    </RepoInfo>
  ) : (
    <RepoInfo>
      <Text>No more repositories to add...</Text>
    </RepoInfo>
  )

  render() {
    const { filteredRepos, filtered, filter } = this.state

    return (
      <React.Fragment>
        <div css={`margin-top: ${3 * GU}px`}>
          <Text weight="bold">
            Which repos do you want to add?
          </Text>
          <div>
            <Query
              fetchPolicy="cache-first"
              query={GET_REPOSITORIES}
              onError={console.error}
            >
              {({ data, loading, error, refetch }) => {
                if (data && data.viewer) {
                  const repos = this.filterAlreadyAdded(data.viewer.repositories.edges)
                  const visibleRepos = filtered ? filteredRepos : repos
                  const repoArray = visibleRepos.map(repo => ({
                    title: repo.node.nameWithOwner,
                    description: '',
                    node: repo.node,
                  }))

                  return (
                    <div>
                      <TextInput
                        type="search"
                        style={{ margin: '16px 0', flexShrink: '0' }}
                        placeholder="Search for a repo"
                        wide
                        value={filter}
                        onChange={this.searchRepos(repos)}
                        adornment={
                          filter === '' && (
                            <IconSearch
                              css={`
                                color: ${theme.surfaceOpened};
                                margin-right: 8px;
                              `}
                            />
                          )
                        }
                        adornmentPosition="end"
                      />
                      <ScrollableList>
                        { this.repoList(visibleRepos, repoArray) }
                      </ScrollableList>
                      <Info css={`margin: ${3 * GU}px 0`}>
                        Projects in Aragon are a one-to-one mapping to a GitHub repository.
                        You’ll be able to prioritize your backlog, reach consensus on issue
                        valuations, and allocate bounties to multiple issues.
                      </Info>
                      <Button
                        mode="strong"
                        wide
                        style={{ flexShrink: '0' }}
                        onClick={this.handleNewProject}
                        disabled={this.state.repoSelected < 0}
                      >
                        Finish
                      </Button>
                    </div>
                  )
                }

                if (loading) return (
                  <RepoInfo>
                    <LoadingAnimation />
                    <div>Loading repositories...</div>
                  </RepoInfo>
                )

                if (error) return (
                  <RepoInfo>
                    <Text size="xsmall" style={{ margin: '20px 0' }}>
                      Error {JSON.stringify(error)}
                    </Text>
                    <Button wide mode="strong" onClick={() => refetch()}>
                      Try refetching?
                    </Button>
                  </RepoInfo>
                )
              }}
            </Query>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

Repo.propTypes = {
  reposAlreadyAdded: PropTypes.array.isRequired,
  onCreateProject: PropTypes.func.isRequired,
}

const createProject = ({ closePanel, addRepo }) => ({ project }) => {
  closePanel()
  addRepo(toHex(project)).toPromise()
}

// TODO: move entire component to functional component
// the following was a quick way to allow us to use hooks
const RepoWrap = () => {
  const {
    api: { addRepo },
    appState: { repos },
  } = useAragonApi()
  const { closePanel } = usePanelManagement()

  // TODO: Review
  // This is breaking RepoList loading sometimes preventing show repos after login
  const reposAlreadyAdded = (repos || []).map(repo => repo.data._repo)

  return (
    <Repo
      onCreateProject={createProject({ closePanel, addRepo })}
      reposAlreadyAdded={reposAlreadyAdded}
    />
  )
}

const ScrollableList = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 10px;
  margin: 16px 0;
  height: calc(100vh - 420px); /* Hack needed to make the scrollable list, since the whole SidePanel is a scrollable container */
`
const RepoInfo = styled.div`
  margin: 20px 0;
  text-align: center;
`

// TODO: Use nodes instead of edges (the app should be adapted at some places)
export default RepoWrap
