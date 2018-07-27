import React from "react";
import styled from "styled-components";
import { Button, EmptyStateCard, SidePanel } from "@aragon/ui";
import { IconEmpty } from "../assets";
import RepoCard from "../components/RepoCard";
import { NewProject } from "../components";

const overviewData = {
  title: "Tools",
  emptyState: {
    title: "You have not added any projects.",
    text: "Get started now by adding a new project.",
    label: "New Project",
    icon: IconEmpty,
    onClick: "openRangeWizard"
  }
};

class Overview extends React.Component {
  state = { sidePanelOpened: false };

  closeSidePanel = () => {
    this.setState({ sidePanelOpened: false });
  };

  openSidePanel = () => {
    this.setState({ sidePanelOpened: true });
  };

  handleRepoSelect = repoId => {
    this.props.onSelect(repoId);
  };
  handleRepoRemove = repoId => {
    this.props.onRemove(repoId);
  };

  render() {
    const { sidePanelOpened } = this.state;
    const { github } = this.props;

    return (
      <StyledOverview>
        {Object.keys(github.reposManaged).length === 0 ? (
          <StyledEmptyStateCard
            title={overviewData.emptyState.title}
            text={overviewData.emptyState.text}
            icon={overviewData.emptyState.icon}
            actionText={overviewData.emptyState.label}
            onActivate={this.openSidePanel}
          />
        ) : (
          Object.entries(github.reposManaged).map(
            ([repoId, { name, description, collaborators, commits, url }]) => (
              <RepoCard
                key={repoId}
                repoId={repoId}
                icon={emptyIcon}
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
          )
        )}
        <StyledButton onClick={this.openSidePanel} mode="strong">
          New Project
        </StyledButton>
        <SidePanel
          title="New Project"
          opened={sidePanelOpened}
          onClose={this.closeSidePanel}
        >
          <NewProject github={github} />
        </SidePanel>
      </StyledOverview>
    );
  }
}

const StyledOverview = styled.section`
  // display: flex;
  // flex-direction: row;
  // background: green;
  // align-content: center;
  // align-items: center;
  // justify-content: center;
  // padding: 30px;
`;

const StyledButton = styled(Button)`
  position: fixed;
  top: 11px;
  right: 30px;
  z-index: 2;
`;

// Pasar a parent?
const StyledEmptyStateCard = styled(EmptyStateCard)`
  padding: 35px;
`;

export default Overview;
