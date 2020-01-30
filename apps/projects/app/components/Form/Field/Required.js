import React from 'react'
import { GU, Text, useTheme } from '@aragon/ui'

export const Required = () => {
  const theme = useTheme()

  return (
    <Text
      size="xsmall"
      color={`${theme.accent}`}
      title="Required"
      css={`margin-left: ${GU}px}`}
    >
      *
    </Text>
  )
}

export default Required
