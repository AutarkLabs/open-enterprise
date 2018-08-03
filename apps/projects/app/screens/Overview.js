import React from 'react'
import styled from 'styled-components'
import { Button, SidePanel } from '@aragon/ui'
import { IconNewProject } from '../assets'
import RepoCard from '../components/RepoCard'
import { NewProject } from '../components'
import PropTypes from 'prop-types'
import EmptyStateCard from '../components/EmptyStateCard'

const overviewData = {
  title: 'Tools',
  emptyState: {
    title: 'You have not added any projects.',
    text: 'Get started now by adding a new project.',
    label: 'New Project',
    icon: IconNewProject,
    onClick: 'openRangeWizard',
  },
}

class Overview extends React.Component {
  state = { sidePanelOpened: false }

  closeSidePanel = () => {
    this.setState({ sidePanelOpened: false })
  }

  openSidePanel = () => {
    this.setState({ sidePanelOpened: true })
  }

  handleRepoSelect = repoId => {
    this.props.onSelect(repoId)
  }
  handleRepoRemove = repoId => {
    this.props.onRemove(repoId)
  }

  render() {
    const { sidePanelOpened } = this.state
    const { github, onHandleAddRepos, onHandleGitHubAuth } = this.props

    return (
      <StyledOverview>
        {Object.keys(github.reposManaged).length === 0 ? (
          <EmptyWrapper>
            <StyledEmptyStateCard
              title={overviewData.emptyState.title}
              text={overviewData.emptyState.text}
              icon={overviewData.emptyState.icon}
              actionText={overviewData.emptyState.label}
              onActivate={this.openSidePanel}
            />
          </EmptyWrapper>
        ) : (
          <CardsWrapper>
            {Object.entries(github.reposManaged).map(
              ([
                repoId,
                { name, description, collaborators, commits, url },
              ]) => (
                <RepoCard
                  className="repo-card"
                  key={repoId}
                  repoId={repoId}
                  // icon={IconEmpty}
                  label={name}
                  description={description}
                  collaborators={collaborators}
                  commits={commits}
                  url={url}
                  active={repoId === github.activeRepo}
                  onSelect={this.handleRepoSelect}
                  onRemove={this.handleRepoRemove}
                />
              )
            )}
          </CardsWrapper>
        )}
        <StyledButton onClick={this.openSidePanel} mode="strong">
          New Project
        </StyledButton>
        <SidePanel
          title="New Project"
          opened={sidePanelOpened}
          onClose={this.closeSidePanel}
        >
          <NewProject
            github={github}
            onHandleAddRepos={onHandleAddRepos}
            onHandleGitHubAuth={onHandleGitHubAuth}
            closeSidePanel={this.closeSidePanel}
          />
        </SidePanel>
      </StyledOverview>
    )
  }
}

const StyledOverview = styled.section`
  padding: 30px;
  display: flex;
  height: 100%;
`

const StyledButton = styled(Button)`
  position: fixed;
  top: 11px;
  right: 30px;
  z-index: 2;
`

const StyledEmptyStateCard = styled(EmptyStateCard)`
  padding: 35px;
`

const EmptyWrapper = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`

const CardsWrapper = styled.div`
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, 249px);
  grid-gap: 30px;
  grid-auto-rows: 220px;
`

export default Overview
