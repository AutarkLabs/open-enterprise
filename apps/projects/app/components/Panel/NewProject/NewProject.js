import PropTypes from 'prop-types'
import React from 'react'
import { Button, Text } from '@aragon/ui'

import RepoSelector from './RepoSelector'
import { STATUS } from '../../../utils/github'

class NewProject extends React.Component {
  static propTypes = {
    /** The current github auth status */
    status: PropTypes.string,
    /** Req: Callback to handle Sign In */
    onGithubSignIn: PropTypes.func.isRequired,
    /** Req: Callback to handle project creation */
    onCreateProject: PropTypes.func.isRequired,
  }
  state = { started: false }

  render() {
    const auth = this.props.status === STATUS.AUTHENTICATED
    const bodyText = auth
      ? 'Projects in Aragon are a one-to-one mapping to a Github repo. By adding a new project, you will be able to use Aragon to:'
      : 'Sign in with GitHub to start managing your repos with Aragon'
    const buttonText = auth ? 'Get Started' : 'Sign in with Github'
    const buttonAction = auth
      ? () => this.setState({ started: true })
      : this.props.onGithubSignIn

    if (this.state.started)
      return <RepoSelector onCreateProject={this.props.onCreateProject} />

    return (
      <React.Fragment>
        <Text size="large" style={{ marginTop: '20px' }} children={bodyText} />
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
          onClick={buttonAction}
          children={buttonText}
        />
      </React.Fragment>
    )
  }
}

export default NewProject
