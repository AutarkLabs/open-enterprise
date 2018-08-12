import React from 'react'

import { ContentLayout } from '.'
import { IconNewProject } from '../../assets'

const emptyState = {
  title: 'You have not added any projects.',
  text: 'Get started now by adding a new project.',
  actionText: 'New Project',
  icon: IconNewProject,
  onClick: '',
}

export const github = {
  authToken: '',
  login: '',
  avatarUrl: '',
  isAuthenticated: false,
  activeRepo: '',
  activeLabel: '',
  activeMilestone: '',
  reposToAdd: {},
  reposFromServer: {},
  reposManaged: {}, // to be populated from contract or git backend itself,
  err: '',
  //    reposManaged: getPreprocessedRepos(), // to be populated from contract or git backend itself
}

// TODO: object.key && content
class Overview extends React.Component {
  render() {
    return (
      <ContentLayout
        isEmpty={!Object.keys(github.reposManaged).length}
        emptyState={emptyState}
      >
        Overview
      </ContentLayout>
    )
  }
}

export default Overview
