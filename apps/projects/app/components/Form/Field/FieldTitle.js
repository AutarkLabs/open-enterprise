import React from 'react'
import styled from 'styled-components'
import { GU, Text, useTheme, unselectable } from '@aragon/ui'
import PropTypes from 'prop-types'
import { Required } from '.'

const FieldTitle = ({ children, required = false }) => {
  const theme = useTheme()

  return <Title color={`${theme.surfaceContentSecondary}`}>
    {children}
    {required && <Required />}
  </Title>
}

FieldTitle.propTypes = PropTypes.node.isRequired

const Title = styled(Text.Block)`
  ${unselectable};
  text-transform: lowercase;
  font-variant: small-caps;
  font-weight: bold;
  color: ${props => props.color};
  margin-bottom: ${.5 * GU}px;
  line-height: ${2 * GU}px;
  height: ${2 * GU}px;
`

export default FieldTitle
