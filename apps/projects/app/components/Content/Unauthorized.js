import React from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  EmptyStateCard,
  Help,
  GU,
  Link,
  LoadingRing,
  Text,
  useTheme,
} from '@aragon/ui'
import { EmptyWrapper } from '../Shared'

import unauthorizedSvg from '../../assets/connect.svg'

const illustration = <img src={unauthorizedSvg} alt="" height="160" />

const InlineHelp = props => (
  <div css={`display: inline-block; margin-left: ${GU}px`}>
    <Help {...props} />
  </div>
)

const Unauthorized = ({ onLogin, isSyncing }) => {
  const theme = useTheme()

  return (
    <EmptyWrapper>
      <EmptyStateCard
        text={
          isSyncing ? (
            <div
              css={`
                display: grid;
                align-items: center;
                justify-content: center;
                grid-template-columns: auto auto;
                grid-gap: ${1 * GU}px;
              `}
            >
              <LoadingRing />
              <span>Syncing…</span>
            </div>
          ) : (
            <React.Fragment>
              <Text css={`display: block; margin-top: ${2 * GU}px`}>
                Connect to GitHub
                <InlineHelp hint="">
                  The Projects app requires you to sign in with GitHub, as the
                  bounty and issue curation system is tied to GitHub issues.
                  Granting this permission does not give any third party access
                  to your GitHub account.{' '}
                  <Link
                    href="https://autark.gitbook.io/open-enterprise/apps/projects#github-authorization"
                  >
                    Read here
                  </Link> for more details.
                </InlineHelp>
              </Text>
              <Text
                css={`display: block; margin-top: ${GU}px; margin-bottom: ${2 * GU}px`}
                size="small"
                color={`${theme.surfaceContentSecondary}`}
              >
                Work on bounties, add funding to issues, or prioritize issues.
              </Text>
            </React.Fragment>
          )}
        illustration={illustration}
        action={ !isSyncing && (
          <Button onClick={onLogin}>Connect</Button>
        )}
        css="height: auto"
      />
    </EmptyWrapper>
  )
}

Unauthorized.propTypes = {
  onLogin: PropTypes.func.isRequired,
  isSyncing: PropTypes.bool.isRequired,
}

export default Unauthorized
