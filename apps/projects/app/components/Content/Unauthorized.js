import React from 'react'
import PropTypes from 'prop-types'
import { Button, EmptyStateCard, GU, LoadingRing, Text, useTheme } from '@aragon/ui'
import { EmptyWrapper } from '../Shared'

import unauthorizedSvg from '../../assets/empty.svg'

const illustration = <img src={unauthorizedSvg} alt="" height="160" />

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
              <Text css={`margin: ${2 * GU}px`}>
                Connect with GitHub
              </Text>
              <Text.Block size="small" color={`${theme.surfaceContentSecondary}`}>
                Work on bounties, add funding to issues, or prioritize issues.
              </Text.Block>
            </React.Fragment>
          )}
        illustration={illustration}
        action={ !isSyncing && (
          <Button onClick={onLogin}>Sign In</Button>
        )}
      />
    </EmptyWrapper>
  )
}

Unauthorized.propTypes = {
  onLogin: PropTypes.func.isRequired,
  isSyncing: PropTypes.bool.isRequired,
}

export default Unauthorized
