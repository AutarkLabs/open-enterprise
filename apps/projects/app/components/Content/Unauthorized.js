import React from 'react'
import PropTypes from 'prop-types'
import { Button, EmptyStateCard, Text, useTheme } from '@aragon/ui'
import { EmptyWrapper } from '../Shared'

import unauthorizedSvg from '../../assets/empty.svg'

const illustration = <img src={unauthorizedSvg} alt="" height="160" />

const Unauthorized = ({ onLogin }) => {
  const theme = useTheme()

  return (
    <EmptyWrapper>
      <EmptyStateCard
        text={<div>
          <Text css="display: block; margin-bottom: 8px">
            No projects here!
          </Text>
          <Text.Block size="small" color={`${theme.surfaceContentSecondary}`}>
          Link your repositories to incentivize work with bounties
          </Text.Block>
        </div>
        }
        illustration={illustration}
        actionText="Connect to GitHub"
        action={
          <Button onClick={onLogin}>Connect to GitHub</Button>
        }
      />
    </EmptyWrapper>
  )
}

Unauthorized.propTypes = {
  onLogin: PropTypes.func.isRequired,
}

export default Unauthorized
