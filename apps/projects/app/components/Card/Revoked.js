import React from 'react'
import PropTypes from 'prop-types'
import { Button, EmptyStateCard, GU, Text, useTheme } from '@aragon/ui'
import { EmptyWrapper } from '../Shared'
import revoked from '../../assets/revoked.svg'

const Illustration = () => <img src={revoked} alt="" />


const Revoked = ({ action }) => {
  const theme = useTheme()
  return (
    <EmptyWrapper>
      <EmptyStateCard
        text={
          <>
            <Text css={`margin: ${GU}px`}>
              Reconnect to GitHub
            </Text>
            <Text.Block
              size="small"
              color={`${theme.surfaceContentSecondary}`}
            >
              It seems that your connection to GitHub has been revoked; please
              reconnect.
            </Text.Block>
          </>
        }
        illustration={<Illustration />}
        action={<Button label="Sign in" onClick={action} />}
      />
    </EmptyWrapper>
  )
}

Revoked.propTypes = {
  action: PropTypes.func.isRequired,
}

export default Revoked
