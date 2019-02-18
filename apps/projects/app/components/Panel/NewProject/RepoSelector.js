import React from 'react'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import styled from 'styled-components'
import { Button, RadioList, Text, TextInput, theme } from '@aragon/ui'

import { LoadingAnimation } from '../../Shared'

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

  componentDidMount() {
    if (this.props.data && this.props.data.viewer) {
      this.setState({
        repos: this.props.data.viewer.repositories.edges,
        filteredRepos: this.props.data.viewer.repositories.edges,
      })
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data.viewer.repositories) {
      this.setState({
        repos: nextProps.data.viewer.repositories.edges,
        filteredRepos: nextProps.data.viewer.repositories.edges,
      })
    }
  }

  // TODO: use observables
  searchRepos = e => {
    const repos = this.state.repos.filter(repo => {
      if (repo.node.nameWithOwner.indexOf(e.target.value) > -1) {
        return repo
      } else {
        return null
      }
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
    const { owner, project } = this.state
    console.log('owner', owner, 'project', project)

    if (project.length > 0) this.props.onCreateProject({ owner, project })
  }

  onRepoSelected = i => {
    this.setState((prevState, _prevProps) => ({
      repoSelected: i,
      project: prevState.filteredRepos[i].node.id,
      owner: prevState.filteredRepos[i].node.owner.id,
    }))
  }

  unselect = () => this.setState({})

  render() {
    const { repos, filteredRepos, filtered, filter } = this.state

    const visibleRepos = filtered ? filteredRepos : repos

    // TODO: extract to component
    const repoArray = visibleRepos.map(repo => ({
      title: repo.node.nameWithOwner,
      value: repo.node.id,
      description: '',
    }))

    const repoList =
      visibleRepos.length > 0 ? (
        <RadioList
          items={repoArray}
          selected={this.state.repoSelected}
          onChange={this.onRepoSelected}
        />
      ) : (
        // <RadioGroup>
        //   {visibleRepos.map((repo, i) => (
        //     <RepoLine repo={repo} i={i} onRepoSelected={this.onRepoSelected} />
        //   ))}
        // </RadioGroup>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: '19px',
            flexDirection: 'column',
          }}
        >
          <Text.Block>
            There are no repositories matching{' '}
            <Text weight="bold">{this.state.filter}</Text>
          </Text.Block>
          <ClearSearch onClick={this.handleClearSearch}>
            Clear Search
          </ClearSearch>
        </div>
      )

    const repositories = repos.length > 0 ? repoList : <Loading />

    return (
      <React.Fragment>
        <div>
          <Text style={{ marginTop: '16px' }} weight="bold">
            Which repos do you want to add?
          </Text>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <TextInput
              type="search"
              style={{ margin: '16px 0', flexShrink: '0' }}
              placeholder="Search for a repo"
              wide
              value={filter}
              onChange={this.searchRepos}
            />
            <div
              style={{
                flexGrow: '1',
                overflowY: 'auto',
                paddingRight: '10px',
                margin: '16px 0',
                // Hack needed to make the scrollable list, since the whole SidePanel is a scrollable container
                height: 'calc(100vh - 253px)',
              }}
            >
              {repositories}
            </div>
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
        </div>
      </React.Fragment>
    )
  }
}

const RepoCard = styled.div`
  border-bottom: 1px #d1d5da solid;
  padding: 16px;
  margin-bottom: 16px;
`

const SearchContainer = styled.div`
  border-bottom: 1px solid #d1d5da;
  padding: 16px 0 16px 0;
`

const SearchBox = styled.input`
  min-height: 34px;
  width: 300px;
  font-size: 14px;
  padding: 6px 8px;
  background-color: #fff;
  background-repeat: no-repeat;
  background-position: right 8px center;
  border: 1px solid #d1d5da;
  border-radius: 3px;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(27, 31, 35, 0.075);
`

const Date = styled.p`
  font-size: 12px;
  color: #586069;
  margin-left: 10px;
  margin-bottom: 0;
`

const InfoContainer = styled.div`
  display: flex;
`

const Circle = styled.div`
  height: 12px;
  width: 12px;
  border-radius: 50%;
  background: #f1e05a;
  margin-right: 5px;
  top: 2px;
  position: relative;
`

const RepoDescription = styled.p`
  font-size: 14px;
  color: #586069;
  margin: 4px 0 10px 0;
`

const RepoLink = styled.a`
  font-weight: 600;
  color: #0366d6;
  cursor: pointer;
  font-size: 20px;
`

const RepoDetails = styled.span`
  color: #586069;
  font-size: 12px;
  margin-bottom: 0;
`

const Icon = styled.i`
  margin-left: 16px;
`

const ScrollWrapper = styled.div`
  /* position: relative; */
  /* z-index: 1; */
  /* max-height: 40%; */
  overflow: auto;
`
const Loading = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      flexDirection: 'column'
    }}
  >
    <LoadingAnimation style={{ marginBottom: '32px' }} />
    Loading repos...
  </div>
)

const ClearSearch = styled(Text.Block).attrs({
  size: 'small',
  color: theme.accent,
})`
  text-decoration: underline;
  margin-top: 15px;
  :hover {
    cursor: pointer;
  }
`
export default graphql(gql`
  query {
    viewer {
      id
      repositories(
        affiliations: [COLLABORATOR, ORGANIZATION_MEMBER, OWNER]
        first: 100
        isFork: false
        orderBy: { field: NAME, direction: ASC }
      ) {
        edges {
          node {
            nameWithOwner
            id
            owner {
              id
            }
          }
        }
      }
    }
  }
`)(Repo)
