import PropTypes from 'prop-types'
import React from 'react'
import { Button, Text } from '@aragon/ui'

import RepoSelector from './RepoSelector'

class NewProject extends React.Component {
  static propTypes = {
    /** Req: Callback to handle project creation */
    onCreateProject: PropTypes.func.isRequired,
    /** Req: repos already added as projects */
    reposAlreadyAdded: PropTypes.array.isRequired,
  }
  state = { started: false }

  render() {
    if (this.state.started)
      return <RepoSelector onCreateProject={this.props.onCreateProject} reposAlreadyAdded={this.props.reposAlreadyAdded} />

    return (
      <React.Fragment>
        <Text size="large" style={{ marginTop: '20px' }}>
          Projects in Aragon are a one-to-one mapping to a Github repo. By
          adding a new project, you will be able to use Aragon to:
        </Text>
        <ul style={{ margin: '20px' }}>
          <li>Prioritize your backlog</li>
          <li>Reach consensus on issue valuations</li>
          <li>Allocate bounties to multiple issues</li>
        </ul>
        {/* {err && (
            <Info background={theme.negative} title="Error">
              {err}
            </Info>
          )} */}
        {/* TODO: Maybe add an "advanced" checkbox to
            conditionally show this fo use personal token?:
            */}
        {/* <Field label="Personal Token">
              <TextInput onChange={this.handleTokenChange} required wide />
            </Field> */}
        <Button
          mode="strong"
          wide
          onClick={() => this.setState({ started: true })}
        >
          Get Started
        </Button>
      </React.Fragment>
    )
  }
}

export default NewProject
