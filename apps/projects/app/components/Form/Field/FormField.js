import React from 'react'
import PropTypes from 'prop-types'
import { Text, useTheme, SidePanelSeparator } from '@aragon/ui'

import { FieldTitle } from '.'

const FormField = ({ input, label, hint, required, separator }) => {
  const theme = useTheme()
  // TODO: Currently it will only work with 1 required child
  // const isRequired = React.Children.toArray(children).some(
  //   ({ props: childProps }) => childProps.required
  // )

  return (
    <div css="margin-bottom: 1rem">
      <FieldTitle>
        {label && <Text color={`${theme.surfaceContentSecondary}`}>{label}</Text>}
        {required && (
          <Text
            size="xsmall"
            color={`${theme.accent}`}
            title="Required"
            style={{ marginLeft: '0.3rem' }}
          >
            *
          </Text>
        )}
      </FieldTitle>
      {hint && (
        <Text size="xsmall" color={`${theme.surfaceContentSecondary}`}>
          {hint}
        </Text>
      )}
      {input}
      {separator && <SidePanelSeparator css="margin-top: 1rem" />}
    </div>
  )
}

FormField.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
  required: PropTypes.bool,
  hint: PropTypes.string,
  input: PropTypes.element,
  separator: PropTypes.bool,
}

export default FormField
