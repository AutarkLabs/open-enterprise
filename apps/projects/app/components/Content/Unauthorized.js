import React from 'react'
import PropTypes from 'prop-types'
import { EmptyStateCard, Text } from '@aragon/ui'
import { IconGitHub, EmptyWrapper } from '../Shared'

const Unauthorized = ({ onLogin }) => (
  <EmptyWrapper>
    <EmptyStateCard
      // style={{ width: '349px', height: '382px', whiteSpace: 'pre-wrap' }}
      style={{ padding: '17px' }}
      title="Projects = Aragon + GitHub *"
      text="Sign in with GitHub to start managing your repositories as projects
          within aragon."
      icon={<IconGitHub height="58px" width="58px" />}
      actionText="Sign in with GitHub"
      onActivate={onLogin}
    />
    <Text size="xsmall" style={{ paddingTop: '10px' }}>
      * Note: we plan to decouple from GitHub in the future!
    </Text>
  </EmptyWrapper>
)

Unauthorized.propTypes = {
  onLogin: PropTypes.func.isRequired,
}

export default Unauthorized
