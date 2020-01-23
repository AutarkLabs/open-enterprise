import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Button, GU, IconSearch, Info, RadioList, Text, TextInput, textStyle, useTheme } from '@aragon/ui'
import { GET_REPOSITORIES } from '../../../utils/gql-queries.js'
import { IconGitHub, LoadingAnimation } from '../../Shared'
import { Query } from 'react-apollo'
import { useAragonApi } from '../../../api-react'
import { usePanelManagement } from '../../Panel'
import { toHex } from 'web3-utils'
import noResultsSvg from '../../../assets/noResults.svg'
import { FormField, FieldTitle } from '../../Form'
import { STATUS } from '../../../utils/github'

const RepoList = ({
  filter,
  handleClearSearch,
  onRepoSelected,
  repoArray,
  repoSelected,
  visibleRepos
}) => {
  const theme = useTheme()

  if (visibleRepos.length) return (
    <StyledRadioList
      items={repoArray}
      selected={repoSelected}
      onChange={onRepoSelected(repoArray)}
    />
  )

  if (filter) return (
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
        onClick={handleClearSearch}
        css={`
          margin-left: 8px;
          border: 0;
          box-shadow: unset;
          padding: 4px;
        `}
      >
        <Text size="small" color={`${theme.link}`}>
          Clear Filters
        </Text>
      </Button>
    </RepoInfo>
  )

  return (
    <RepoInfo>
      <Text>No more repositories to add...</Text>
    </RepoInfo>
  )
}
RepoList.propTypes = {
  filter: PropTypes.string.isRequired,
  handleClearSearch: PropTypes.func.isRequired,
  onRepoSelected: PropTypes.func.isRequired,
  repoArray: PropTypes.array.isRequired,
  repoSelected: PropTypes.number.isRequired,
  visibleRepos: PropTypes.array.isRequired,
}

const RepoQuery = ({ onRepoSelected, repoSelected, setRepoSelected }) => {
  const theme = useTheme()
  const [ filter, setFilter ] = useState('')
  const searchRef = useRef(null)
  const { appState: { repos } } = useAragonApi()

  /*
    TODO: Review
    This line below might be breaking RepoList loading sometimes preventing show repos after login
  */
  const reposAlreadyAdded = (repos || []).map(repo => repo.data._repo)

  useEffect(() => { searchRef.current && searchRef.current.focus()})

  const filterAlreadyAdded = repos => {
    return repos.filter(repo => !reposAlreadyAdded.includes(repo.node.id))
  }
  const filterByName = repos => {
    return repos.filter(repo => repo.node.nameWithOwner.indexOf(filter) > -1)
  }

  const updateFilter = e => {
    setFilter(e.target.value)
    setRepoSelected(-1)
  }

  const handleClearSearch = () => setFilter('')

  return (
    <Query
      fetchPolicy="cache-first"
      query={GET_REPOSITORIES}
      onError={console.error}
    >
      {({ data, loading, error, refetch }) => {
        if (data && data.viewer) {
          const reposDownloaded = filterAlreadyAdded(data.viewer.repositories.edges)
          const visibleRepos = filter ? filterByName(reposDownloaded) : reposDownloaded
          // eslint-disable-next-line react/prop-types
          const repoArray = visibleRepos.map(repo => ({
            title: repo.node.nameWithOwner,
            description: '',
            node: repo.node,
          }))

          return (
            <div>
              <FieldTitle>Repository</FieldTitle>
              <TextInput
                type="search"
                placeholder="Search for a repository"
                wide
                value={filter}
                onChange={updateFilter}
                adornment={
                  filter === '' && (
                    <IconSearch
                      css={`
                        color: ${theme.surfaceOpened};
                        margin-right: ${GU}px;
                      `}
                    />
                  )
                }
                adornmentPosition="end"
                ref={searchRef}
                aria-label="Search"
              />

              <ScrollableList>
                <RepoList
                  visibleRepos={visibleRepos}
                  repoArray={repoArray}
                  repoSelected={repoSelected}
                  onRepoSelected={onRepoSelected}
                  filter={filter}
                  handleClearSearch={handleClearSearch}
                />
              </ScrollableList>

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
  )
}
RepoQuery.propTypes = {
  onRepoSelected: PropTypes.func.isRequired,
  repoSelected: PropTypes.number.isRequired,
  setRepoSelected: PropTypes.func.isRequired,
}

const GitHubRepoList = ({ handleGithubSignIn }) => {
  const {
    api,
    appState: {
      github = { status: STATUS.INITIAL },
    },
  } = useAragonApi()
  const { closePanel } = usePanelManagement()
  const [ project, setProject ] = useState()
  const [ repoSelected, setRepoSelected ] = useState(-1)
  const theme = useTheme()

  const handleNewProject = () => {
    closePanel()
    api.addRepo(toHex(project)).toPromise()
  }

  const onRepoSelected = repoArray => i => {
    setProject(repoArray[i].node.id)
    setRepoSelected(i)
  }

  return (
    <>
      {github.status !== 'authenticated' ? (
        <div style={{ width: '100%', textAlign: 'center', marginBottom: (3 * GU) + 'px' }}>
          <Button
            mode="normal"
            onClick={handleGithubSignIn}
          >
            <IconGitHub
              color={`${theme.surfaceIcon}`}
              width="18px"
              height="18px"
            />
            <span css="margin-top: 3px; margin-left: 8px">Select from GitHub</span>
          </Button>
        </div>
      ) : (
        <RepoQuery
          onRepoSelected={onRepoSelected}
          repoSelected={repoSelected}
          setRepoSelected={setRepoSelected}
        />
      )}
      <Button
        mode="strong"
        wide
        onClick={handleNewProject}
        disabled={repoSelected < 0}
      >
        Submit
      </Button>
    </>
  )
}
GitHubRepoList.propTypes = PropTypes.func.isRequired

const createProject = () => {}

const NewProject = ({ handleGithubSignIn }) => {
  const [ title, setTitle ] = useState('')
  const [ description, setDescription ] = useState('')
  const theme = useTheme()
  const { appState: { github = { status: STATUS.INITIAL } } } = useAragonApi()

  return (
    <PanelContent>
      <InfoBox>
        Create a new project that belongs and operates entirely within this application, or synchronize one from GitHub.
      </InfoBox>

      {
        // eslint-disable-next-line no-constant-condition
        true ? (
          <GitHubRepoList handleGithubSignIn={handleGithubSignIn} />
        ) : (
        <>
      <FormField
        label="Title"
        required={github.status !== 'authenticated' || title !== ''}
        input={
          <TextInput
            wide
            value={title}
            onChange={e => setTitle(e.target.value)}
            aria-label="Title"
          />
        }
      />

      {title !== '' ? (
        <>
        <FormField
          label="Description"
          input={
            <TextInput.Multiline
              name="description"
              rows="3"
              onChange={e => setDescription(e.target.value)}
              value={description}
              wide
              aria-label="Description"
            />
          }
        />
        <Button
          mode="strong"
          wide
          onClick={createProject}
          disabled={title === ''}
        >
          Submit
        </Button>
        </>
      ) : (
        <>
        <ThematicBreak
          color={`${theme.surfaceContentSecondary}`}
          linecolor={`${theme.border}`}
        >
            OR
        </ThematicBreak>
        <GitHubRepoList handleGithubSignIn={handleGithubSignIn} />
        </>
      )}
      </>
        )}
    </PanelContent>
  )
}
NewProject.propTypes = PropTypes.func.isRequired

const InfoBox = styled(Info)`
  margin-bottom: ${2 * GU}px;
`
const ScrollableList = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 10px;
  margin: 16px 0;
  /* Hack needed to make the scrollable list, since the whole SidePanel is a scrollable container */
  height: calc(100vh - 470px);
`
const StyledRadioList = styled(RadioList)`
  > * {
    div {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`
const RepoInfo = styled.div`
  margin: 20px 0;
  text-align: center;
`
const PanelContent = styled.div`
  margin-top: ${3 * GU}px;
`
const ThematicBreak = styled.div`
  align-items: center;
  display: flex;
  margin: ${2 * GU}px 0;
  text-align: center;
  color: ${props => props.color};
  ::before,
  ::after {
    flex: 1;
    content: ' ';
    display: block;
    border-bottom: 1px solid ${props => props.linecolor};
    height: 1px;
  }
  ::before {
    margin-right: ${.5 * GU}px;
  }
  ::after {
    margin-left: ${.5 * GU}px;
  }

  ${textStyle('label2')};
`

// TODO: Use nodes instead of edges (the app should be adapted at some places)
export default NewProject
