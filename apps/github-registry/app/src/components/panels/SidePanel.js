import React, { Component } from 'react'
import { SidePanel as BasePanel } from '@aragon/ui'
import { SidePanelConsumer } from 'context'

// Todo rename PanelContent suffix to Panel
class SidePanel extends Component {
  render() {
    return (
      <SidePanelConsumer>
        {({
          sidePanelOpened,
          sidePanelClose,
          sidePanelTitle,
          sidePanelContent: PanelContent,
        }) => (
          <BasePanel
            title={sidePanelTitle}
            opened={sidePanelOpened}
            onClose={sidePanelClose}
          >
            <PanelContent />
          </BasePanel>
        )}
      </SidePanelConsumer>
    )
  }
}

export default SidePanel

// this comes from former App.js render method, outside AppLayout:
//           SidePanels should live in appropriate screen, but screen is a component one
//           level down and in order to communicate with <App> (where data is stored)
//           they need to be given multiple callbacks in props - easier to keep them all here.
//         <SidePanel
//           title="Add Project"
//           opened={createProjectVisible}
//           onClose={this.handleCreateProjectClose}
//         >
//           <NewProjectPanelContent
//             opened={createProjectVisible}
//             onCreateProject={this.handleCreateProject}
//             onHandleAddRepos={this.handleAddRepos.bind(this)}
//             onHandleGitHubAuth={this.handleGitHubAuth}
//             github={github}
//           />
//         </SidePanel>
//         <SidePanel
//           title="New Issue"
//           opened={createIssueVisible}
//           onClose={this.handleCreateIssueClose}
//         >
//           <NewIssuePanelContent
//             opened={createIssueVisible}
//             onCreateIssue={this.handleCreateIssue}
//             onHandleGitHubAuth={this.handleGitHubAuth}
//             github={github}
//           />
//         </SidePanel>
