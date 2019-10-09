import React from 'react'
import styled from 'styled-components'
import { Text, useTheme, unselectable } from '@aragon/ui'
import PropTypes from 'prop-types'

const FieldTitle = ({ children }) => {
  const theme = useTheme()

  return <Title color={`${theme.surfaceContentSecondary}`}>
    {children}
  </Title>
}

FieldTitle.propTypes = PropTypes.node.isRequired

const Title = styled(Text.Block)`
  ${unselectable};
  text-transform: lowercase;
  font-variant: small-caps;
  font-weight: bold;
  color: theme.surfaceContentSecondary
`

export default FieldTitle
