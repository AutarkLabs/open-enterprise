import React from 'react'
import styled from 'styled-components'
import { Button } from '@aragon/ui'


class NewProjectPanelContent extends React.Component {
  state = {
    isAuthenticated: false
  }

  handleSubmit = event => {
    // would be nice to include some filtering/validating
    event.preventDefault()
    this.props.onCreateProject(this.state.projectName.trim())
  }
  render() {
    const { isAuthenticated } = this.state
    return (
      <div>
        Sign in with GitHub to start managing your repos with Aragon
        <ul>
          <li>Prioritize your backlog</li>
          <li>Reach consensus on issue valuations</li>
          <li>Allocate bounties to multiple issues</li>
        </ul>
          <Button mode="strong" type="submit" wide>
             Sign in with GitHub 
          </Button>
      </div>
    )
  }
}

export default NewProjectPanelContent

