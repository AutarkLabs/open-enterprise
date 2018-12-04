import PropTypes from 'prop-types'
import React from 'react'

import GithubAuth from './GithubAuth'
import RepoSelector from './RepoSelector'
import { STATUS } from '../../../utils/github'

const NewProject = ({
  onCreateProject,
  onGithubSignIn,
  status = STATUS.INITIAL,
}) =>
  status === STATUS.AUTHENTICATED ? (
    <RepoSelector onCreateProject={onCreateProject} />
  ) : (
    <GithubAuth onGithubSignIn={onGithubSignIn} />
  )
// {/* TODO: {status === STATUS.REQUESTING && <Loading />} */}
NewProject.propTypes = {
  /** The current github auth status */
  status: PropTypes.string,
  /** Req: Callback to handle Sign In */
  onGithubSignIn: PropTypes.func.isRequired,
  /** Req: Callback to handle project creation */
  onCreateProject: PropTypes.func.isRequired,
}
export default NewProject
